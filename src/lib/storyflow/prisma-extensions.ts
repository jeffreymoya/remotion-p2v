import { Prisma, ProjectStatus } from "@/src/generated/storyflow/client";
import { NotFoundError } from "@/app/api/lib";

type ProjectFindByIdArgs = Omit<Prisma.ProjectFindUniqueArgs, "where">;
type ScriptFindArgs = Omit<Prisma.ScriptFindUniqueArgs, "where">;
type BlueprintFindArgs = Omit<Prisma.BlueprintFindUniqueArgs, "where">;
type AssetFindArgs = Omit<Prisma.AssetFindUniqueArgs, "where">;

export const projectExtension = Prisma.defineExtension({
  model: {
    project: {
      async findByIdOrThrow<T extends ProjectFindByIdArgs>(id: string, args?: T) {
        const ctx = Prisma.getExtensionContext(this);
        const project = await (ctx as any).findUnique({
          where: { id },
          ...(args ?? {}),
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async findWithScript(id: string) {
        const ctx = Prisma.getExtensionContext(this);
        const project = await (ctx as any).findUnique({
          where: { id },
          include: { scriptDrafts: true },
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async findWithAssets(id: string) {
        const ctx = Prisma.getExtensionContext(this);
        const project = await (ctx as any).findUnique({
          where: { id },
          include: { assets: true },
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async updateStatus(id: string, status: ProjectStatus) {
        const ctx = Prisma.getExtensionContext(this);
        return (ctx as any).update({
          where: { id },
          data: { status, updatedAt: new Date() },
        });
      },
    },
    script: {
      async findByProjectIdOrThrow<T extends ScriptFindArgs>(projectId: string, args?: T) {
        const ctx = Prisma.getExtensionContext(this);
        const script = await (ctx as any).findUnique({
          where: { projectId },
          ...(args ?? {}),
        });

        if (!script) {
          throw new NotFoundError("Script", projectId);
        }

        return script;
      },
    },
    blueprint: {
      async findByIdOrThrow<T extends BlueprintFindArgs>(id: string, args?: T) {
        const ctx = Prisma.getExtensionContext(this);
        const blueprint = await (ctx as any).findUnique({
          where: { id },
          ...(args ?? {}),
        });

        if (!blueprint) {
          throw new NotFoundError("Blueprint", id);
        }

        return blueprint;
      },
    },
    asset: {
      async findByIdOrThrow<T extends AssetFindArgs>(id: string, args?: T) {
        const ctx = Prisma.getExtensionContext(this);
        const asset = await (ctx as any).findUnique({
          where: { id },
          ...(args ?? {}),
        });

        if (!asset) {
          throw new NotFoundError("Asset", id);
        }

        return asset;
      },
    },
  },
});
