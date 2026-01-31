import { Prisma, ProjectStatus } from "@/src/generated/storyflow/client";
import { NotFoundError } from "@/app/api/lib";

type ProjectFindByIdArgs = Omit<Prisma.ProjectFindUniqueArgs, "where">;
type ScriptFindArgs = Omit<Prisma.ScriptFindUniqueArgs, "where">;
type BlueprintFindArgs = Omit<Prisma.BlueprintFindUniqueArgs, "where">;
type AssetFindArgs = Omit<Prisma.AssetFindUniqueArgs, "where">;

export const projectExtension = Prisma.defineExtension((client) => ({
  model: {
    project: {
      async findByIdOrThrow<T extends ProjectFindByIdArgs>(id: string, args?: T) {
        const project = await client.project.findUnique({
          where: { id },
          ...(args ?? {}),
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async findWithScript(id: string) {
        const project = await client.project.findUnique({
          where: { id },
          include: { scriptDrafts: true },
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async findWithAssets(id: string) {
        const project = await client.project.findUnique({
          where: { id },
          include: { assets: true },
        });

        if (!project) {
          throw new NotFoundError("Project", id);
        }

        return project;
      },
      async updateStatus(id: string, status: ProjectStatus) {
        return client.project.update({
          where: { id },
          data: { status, updatedAt: new Date() },
        });
      },
    },
    script: {
      async findByProjectIdOrThrow<T extends ScriptFindArgs>(projectId: string, args?: T) {
        const script = await client.script.findUnique({
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
        const blueprint = await client.blueprint.findUnique({
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
        const asset = await client.asset.findUnique({
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
}));
