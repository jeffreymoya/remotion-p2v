import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, ValidationError, parseBody, withErrorHandler } from "@/app/api/lib";
import { ensureProjectDirs, getProjectPaths, getPublicDir } from "@/src/lib/paths";
import { extractMetadata } from "@/src/lib/storyflow/assets";
import type { Asset } from "@/src/generated/storyflow";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const trackSchema = z.object({
  id: z.string().min(1),
  source: z.literal("pixabay"),
  title: z.string().min(1),
  downloadUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  tags: z.string().optional(),
  author: z.string().optional(),
});

const selectionSchema = z.union([
  z.object({
    assetId: z.string().min(1),
    volume: z.number().min(0).max(1).optional(),
  }),
  z.object({
    track: trackSchema,
    volume: z.number().min(0).max(1).optional(),
  }),
]);

type Params = { params: Promise<{ id: string }> };

const ALLOWED_DOWNLOAD_HOSTS = ["pixabay.com", "cdn.pixabay.com"];

function assertAllowedHost(urlString: string) {
  const parsed = new URL(urlString);
  const host = parsed.hostname.replace(/^www\./, "");
  const allowed = ALLOWED_DOWNLOAD_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  if (!allowed) {
    throw new Error("Download URL host is not allowed");
  }
  return parsed;
}

function makeFilename(track: z.infer<typeof trackSchema>, ext: string) {
  const safeTitle = (track.title || "track")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const safeId = track.id.replace(/[^a-z0-9]+/gi, "").slice(-12) || "id";
  const suffix = safeTitle || "track";
  const extension = ext || "mp3";
  return `${suffix}-${safeId}.${extension}`;
}

export const POST = withErrorHandler(async (req: Request, { params }: Params) => {
  const { id } = await params;
  const parsed = await parseBody(req, selectionSchema);

  const project = await storyflowPrisma.project.findByIdOrThrow(id, {
    include: { settings: true },
  });

  const volume = parsed.volume ?? project.settings?.musicVolume ?? 0.3;
  let selectedAssetId: string;
  let createdAsset: Asset | null = null;

  if ("assetId" in parsed) {
    const asset = await storyflowPrisma.asset.findByIdOrThrow(parsed.assetId);

    if (asset.projectId !== id) {
      throw new NotFoundError("Asset", parsed.assetId);
    }

    if (asset.type !== "MUSIC") {
      throw new ValidationError("Only music assets can be selected as soundtrack");
    }

    selectedAssetId = asset.id;
  } else {
    const track = parsed.track;
    const downloadUrl = assertAllowedHost(track.downloadUrl);

    const response = await fetch(downloadUrl.toString());
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download track (${response.status})` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = path.extname(downloadUrl.pathname).replace(".", "") || "mp3";
    const filename = makeFilename(track, ext);
    const paths = getProjectPaths(id);
    const absolutePath = path.join(paths.assetsMusic, filename);
    const relativePath = path.relative(getPublicDir(), absolutePath);

    await ensureProjectDirs(id);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    const metadata = await extractMetadata(absolutePath, "MUSIC").catch(() => null);

    createdAsset = await storyflowPrisma.asset.create({
      data: {
        projectId: id,
        type: "MUSIC",
        filename,
        path: `/${relativePath.replace(/\\/g, "/")}`,
        metadata: {
          ...(metadata ?? {}),
          trackId: track.id,
          source: track.source,
          title: track.title,
          duration: metadata?.duration ?? track.duration ?? null,
        },
      },
    });

    selectedAssetId = createdAsset.id;
  }

  await storyflowPrisma.projectSettings.upsert({
    where: { projectId: id },
    create: { projectId: id, musicTrackId: selectedAssetId, musicVolume: volume },
    update: { musicTrackId: selectedAssetId, musicVolume: volume },
  });

  if (project.status === "DRAFT" || project.status === "SCRIPT_READY") {
    await storyflowPrisma.project.update({
      where: { id },
      data: { status: "ASSETS_READY" },
    });
  }

  return NextResponse.json({
    success: true,
    selectedAssetId,
    asset: createdAsset,
  });
}, "projects/[id]/music");
