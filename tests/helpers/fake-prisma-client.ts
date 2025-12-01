import { randomUUID } from 'crypto';
import { Image, ImageTag, Prisma, Video, VideoTag } from '../../src/generated/prisma/client';

// Minimal in-memory Prisma replacement used by unit tests; implements the methods
// LocalMediaRepo calls (findUnique/findMany/create/update/updateMany/createMany).
export class FakePrismaClient {
  private images: Array<Image & { tags: ImageTag[] }> = [];
  private videos: Array<Video & { tags: VideoTag[] }> = [];
  private imageTags: ImageTag[] = [];
  private videoTags: VideoTag[] = [];
  private connected = false;

  async $connect(): Promise<void> {
    this.connected = true;
  }

  async $disconnect(): Promise<void> {
    this.connected = false;
  }

  image = {
    findUnique: async (args: Prisma.ImageFindUniqueArgs) => {
      const sha = (args.where as any).sha256;
      const match = this.images.find(img => img.sha256 === sha);
      if (!match) return null;
      return args.include?.tags ? { ...match, tags: [...match.tags] } : { ...match };
    },
    findMany: async (args: Prisma.ImageFindManyArgs) => {
      let results = [...this.images];
      const where: any = args.where || {};

      if (where.sha256) results = results.filter(r => r.sha256 === where.sha256);
      if (where.originalSha256) results = results.filter(r => r.originalSha256 === where.originalSha256);
      if (where.id?.in) results = results.filter(r => (where.id.in as string[]).includes(r.id));
      if (where.id?.notIn) results = results.filter(r => !(where.id.notIn as string[]).includes(r.id));
      if (where.width?.gte) results = results.filter(r => r.width >= where.width.gte);
      if (where.height?.gte) results = results.filter(r => r.height >= where.height.gte);
      const tagList = where.tags?.some?.tag?.in as string[] | undefined;
      if (tagList?.length) {
        results = results.filter(r => r.tags.some(t => tagList.includes(t.tag)));
      }

      if (Array.isArray(where.OR) && where.OR.length) {
        results = results.filter(r =>
          where.OR.some((clause: any) => {
            const shaMatch = clause.sha256 ? r.sha256 === clause.sha256 : false;
            const origMatch = clause.originalSha256 ? r.originalSha256 === clause.originalSha256 : false;
            return shaMatch || origMatch;
          })
        );
      }

      const order = args.orderBy as any;
      if (order?.length) {
        results.sort((a, b) => {
          for (const ord of order) {
            const key = Object.keys(ord)[0] as keyof Image;
            const dir = (ord as any)[key];
            if (a[key] < b[key]) return dir === 'desc' ? 1 : -1;
            if (a[key] > b[key]) return dir === 'desc' ? -1 : 1;
          }
          return 0;
        });
      }

      if (typeof args.take === 'number') {
        results = results.slice(0, args.take);
      }

      return results.map(r => (args.include?.tags ? { ...r, tags: [...r.tags] } : { ...r }));
    },
    create: async (args: Prisma.ImageCreateArgs) => {
      const id = randomUUID();
      const createdAt = new Date();
      const base: Image = {
        id,
        sha256: args.data.sha256,
        originalSha256: (args.data as any).originalSha256 ?? args.data.sha256,
        filename: args.data.filename,
        ext: args.data.ext,
        bytes: args.data.bytes,
        width: args.data.width,
        height: args.data.height,
        provider: args.data.provider,
        sourceUrl: (args.data as any).sourceUrl ?? null,
        path: args.data.path,
        thumbPath: (args.data as any).thumbPath ?? null,
        embedding: (args.data as any).embedding ?? [],
        createdAt,
        lastUsedAt: createdAt,
      };

      const tags = (args.data as any).tags?.create?.map((t: any) => ({ imageId: id, tag: t.tag })) || [];
      this.imageTags.push(...tags);
      const withTags = { ...base, tags } as Image & { tags: ImageTag[] };
      this.images.push(withTags);
      return args.include?.tags ? { ...base, tags: [...tags] } : base;
    },
    findFirst: async (args: Prisma.ImageFindFirstArgs) => {
      const results = await (this.image as any).findMany({ ...(args as any), take: args.take ?? 1 });
      return results[0] || null;
    },
    aggregate: async (_args: Prisma.ImageAggregateArgs) => {
      const sumBytes = this.images.reduce((sum, img) => sum + (img.bytes || 0), 0);
      return { _sum: { bytes: sumBytes }, _count: { id: this.images.length } } as any;
    },
    delete: async (args: Prisma.ImageDeleteArgs) => {
      const id = (args.where as any).id as string;
      const idx = this.images.findIndex(img => img.id === id);
      if (idx === -1) throw new Error('Image not found');
      const [removed] = this.images.splice(idx, 1);
      this.imageTags = this.imageTags.filter(t => t.imageId !== id);
      return removed;
    },
    deleteMany: async (args: Prisma.ImageDeleteManyArgs) => {
      const ids = (args.where as any)?.id?.in as string[] | undefined;
      if (!ids) return { count: 0 } as any;
      const before = this.images.length;
      this.images = this.images.filter(img => !ids.includes(img.id));
      this.imageTags = this.imageTags.filter(t => !ids.includes(t.imageId));
      return { count: before - this.images.length } as any;
    },
    count: async (_args?: Prisma.ImageCountArgs) => {
      return this.images.length;
    },
    update: async (args: Prisma.ImageUpdateArgs) => {
      const id = (args.where as any).id as string;
      const idx = this.images.findIndex(img => img.id === id);
      if (idx === -1) throw new Error('Image not found');
      const current = this.images[idx];
      const updated: Image = {
        ...current,
        ...(args.data as any),
        lastUsedAt: (args.data as any).lastUsedAt ?? current.lastUsedAt,
      } as Image;
      const withTags = { ...updated, tags: [...current.tags] } as Image & { tags: ImageTag[] };
      this.images[idx] = withTags;
      return args.include?.tags ? { ...updated, tags: [...withTags.tags] } : updated;
    },
    updateMany: async (args: Prisma.ImageUpdateManyArgs) => {
      const ids = (args.where as any)?.id?.in as string[] | undefined;
      const data = args.data as any;
      this.images = this.images.map(img => {
        if (ids?.includes(img.id)) {
          const updated: Image = { ...img, ...data } as Image;
          return { ...updated, tags: [...img.tags] } as any;
        }
        return img;
      });
      return { count: ids?.length || 0 } as any;
    },
  };

  video = {
    findUnique: async (args: Prisma.VideoFindUniqueArgs) => {
      const sha = (args.where as any).sha256;
      const match = this.videos.find(v => v.sha256 === sha);
      if (!match) return null;
      return args.include?.tags ? { ...match, tags: [...match.tags] } : { ...match };
    },
    findMany: async (args: Prisma.VideoFindManyArgs) => {
      let results = [...this.videos];
      const where: any = args.where || {};
      if (where.sha256) results = results.filter(r => r.sha256 === where.sha256);
      if (where.originalSha256) results = results.filter(r => r.originalSha256 === where.originalSha256);
      if (where.id?.in) results = results.filter(r => (where.id.in as string[]).includes(r.id));
      if (where.id?.notIn) results = results.filter(r => !(where.id.notIn as string[]).includes(r.id));
      if (where.width?.gte) results = results.filter(r => r.width >= where.width.gte);
      if (where.height?.gte) results = results.filter(r => r.height >= where.height.gte);
      if (where.durationMs?.gte) results = results.filter(r => r.durationMs >= where.durationMs.gte);
      const tagList = where.tags?.some?.tag?.in as string[] | undefined;
      if (tagList?.length) {
        results = results.filter(r => r.tags.some(t => tagList.includes(t.tag)));
      }

      if (Array.isArray(where.OR) && where.OR.length) {
        results = results.filter(r =>
          where.OR.some((clause: any) => {
            const shaMatch = clause.sha256 ? r.sha256 === clause.sha256 : false;
            const origMatch = clause.originalSha256 ? r.originalSha256 === clause.originalSha256 : false;
            return shaMatch || origMatch;
          })
        );
      }

      const order = args.orderBy as any;
      if (order?.length) {
        results.sort((a, b) => {
          for (const ord of order) {
            const key = Object.keys(ord)[0] as keyof Video;
            const dir = (ord as any)[key];
            if (a[key] < b[key]) return dir === 'desc' ? 1 : -1;
            if (a[key] > b[key]) return dir === 'desc' ? -1 : 1;
          }
          return 0;
        });
      }

      if (typeof args.take === 'number') results = results.slice(0, args.take);
      return results.map(r => (args.include?.tags ? { ...r, tags: [...r.tags] } : { ...r }));
    },
    create: async (args: Prisma.VideoCreateArgs) => {
      const id = randomUUID();
      const createdAt = new Date();
      const base: Video = {
        id,
        sha256: args.data.sha256,
        originalSha256: (args.data as any).originalSha256 ?? args.data.sha256,
        filename: args.data.filename,
        ext: args.data.ext,
        bytes: args.data.bytes,
        width: args.data.width,
        height: args.data.height,
        durationMs: args.data.durationMs,
        fps: (args.data as any).fps ?? null,
        videoCodec: (args.data as any).videoCodec ?? null,
        audioCodec: (args.data as any).audioCodec ?? null,
        bitrate: (args.data as any).bitrate ?? null,
        hasAudio: (args.data as any).hasAudio ?? false,
        provider: args.data.provider,
        sourceUrl: (args.data as any).sourceUrl ?? null,
        path: args.data.path,
        thumbPath: (args.data as any).thumbPath ?? null,
        embedding: (args.data as any).embedding ?? [],
        createdAt,
        lastUsedAt: createdAt,
      };

      const tags = (args.data as any).tags?.create?.map((t: any) => ({ videoId: id, tag: t.tag })) || [];
      this.videoTags.push(...tags);
      const withTags = { ...base, tags } as Video & { tags: VideoTag[] };
      this.videos.push(withTags);
      return args.include?.tags ? { ...base, tags: [...tags] } : base;
    },
    findFirst: async (args: Prisma.VideoFindFirstArgs) => {
      const results = await (this.video as any).findMany({ ...(args as any), take: args.take ?? 1 });
      return results[0] || null;
    },
    aggregate: async (_args: Prisma.VideoAggregateArgs) => {
      const sumBytes = this.videos.reduce((sum, vid) => sum + (vid.bytes || 0), 0);
      return { _sum: { bytes: sumBytes }, _count: { id: this.videos.length } } as any;
    },
    delete: async (args: Prisma.VideoDeleteArgs) => {
      const id = (args.where as any).id as string;
      const idx = this.videos.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Video not found');
      const [removed] = this.videos.splice(idx, 1);
      this.videoTags = this.videoTags.filter(t => t.videoId !== id);
      return removed;
    },
    deleteMany: async (args: Prisma.VideoDeleteManyArgs) => {
      const ids = (args.where as any)?.id?.in as string[] | undefined;
      if (!ids) return { count: 0 } as any;
      const before = this.videos.length;
      this.videos = this.videos.filter(v => !ids.includes(v.id));
      this.videoTags = this.videoTags.filter(t => !ids.includes(t.videoId));
      return { count: before - this.videos.length } as any;
    },
    count: async (_args?: Prisma.VideoCountArgs) => {
      return this.videos.length;
    },
    update: async (args: Prisma.VideoUpdateArgs) => {
      const id = (args.where as any).id as string;
      const idx = this.videos.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Video not found');
      const current = this.videos[idx];
      const updated: Video = {
        ...current,
        ...(args.data as any),
        lastUsedAt: (args.data as any).lastUsedAt ?? current.lastUsedAt,
      } as Video;
      const withTags = { ...updated, tags: [...current.tags] } as Video & { tags: VideoTag[] };
      this.videos[idx] = withTags;
      return args.include?.tags ? { ...updated, tags: [...withTags.tags] } : updated;
    },
    updateMany: async (args: Prisma.VideoUpdateManyArgs) => {
      const ids = (args.where as any)?.id?.in as string[] | undefined;
      const data = args.data as any;
      this.videos = this.videos.map(v => {
        if (ids?.includes(v.id)) {
          const updated: Video = { ...v, ...data } as Video;
          return { ...updated, tags: [...v.tags] } as any;
        }
        return v;
      });
      return { count: ids?.length || 0 } as any;
    },
  };

  imageTag = {
    createMany: async ({ data, skipDuplicates }: Prisma.ImageTagCreateManyArgs) => {
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        const exists = this.imageTags.some(t => t.imageId === (entry as any).imageId && t.tag === (entry as any).tag);
        if (exists && skipDuplicates) continue;
        this.imageTags.push({ imageId: (entry as any).imageId, tag: (entry as any).tag });
        const img = this.images.find(i => i.id === (entry as any).imageId);
        if (img) img.tags.push({ imageId: img.id, tag: (entry as any).tag });
      }
      return { count: entries.length } as any;
    },
  };

  videoTag = {
    createMany: async ({ data, skipDuplicates }: Prisma.VideoTagCreateManyArgs) => {
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        const exists = this.videoTags.some(t => t.videoId === (entry as any).videoId && t.tag === (entry as any).tag);
        if (exists && skipDuplicates) continue;
        this.videoTags.push({ videoId: (entry as any).videoId, tag: (entry as any).tag });
        const vid = this.videos.find(v => v.id === (entry as any).videoId);
        if (vid) vid.tags.push({ videoId: vid.id, tag: (entry as any).tag });
      }
      return { count: entries.length } as any;
    },
  };
}

export function createFakePrismaClient(): FakePrismaClient {
  return new FakePrismaClient();
}
