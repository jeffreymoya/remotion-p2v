import { PrismaClient, ProjectStatus } from "../../generated/storyflow/client";
import { env } from "@/src/env";

// Extended client typing with helper methods while preserving all model delegates
export type StoryflowPrismaClient = PrismaClient & {
  project: PrismaClient["project"] & {
    findByIdOrThrow<T extends Omit<Parameters<PrismaClient["project"]["findUnique"]>[0], "where">>(
      id: string,
      args?: T
    ): ReturnType<PrismaClient["project"]["findUnique"]>;
    findWithScript(id: string): ReturnType<PrismaClient["project"]["findUnique"]>;
    findWithAssets(id: string): ReturnType<PrismaClient["project"]["findUnique"]>;
    updateStatus(id: string, status: ProjectStatus): ReturnType<PrismaClient["project"]["update"]>;
  };
  script: PrismaClient["script"] & {
    findByProjectIdOrThrow<T extends Omit<Parameters<PrismaClient["script"]["findUnique"]>[0], "where">>(
      projectId: string,
      args?: T
    ): ReturnType<PrismaClient["script"]["findUnique"]>;
  };
  blueprint: PrismaClient["blueprint"] & {
    findByIdOrThrow<T extends Omit<Parameters<PrismaClient["blueprint"]["findUnique"]>[0], "where">>(
      id: string,
      args?: T
    ): ReturnType<PrismaClient["blueprint"]["findUnique"]>;
  };
  asset: PrismaClient["asset"] & {
    findByIdOrThrow<T extends Omit<Parameters<PrismaClient["asset"]["findUnique"]>[0], "where">>(
      id: string,
      args?: T
    ): ReturnType<PrismaClient["asset"]["findUnique"]>;
  };
};

function attachExtensions(client: PrismaClient): StoryflowPrismaClient {
  const projectDelegate = client.project as StoryflowPrismaClient["project"];
  projectDelegate.findByIdOrThrow = async (id, args) => {
    const project = await client.project.findUnique({
      where: { id },
      ...(args ?? {}),
    });
    if (!project) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Project", id);
    }
    return project;
  };

  projectDelegate.findWithScript = async (id: string) => {
    const project = await client.project.findUnique({
      where: { id },
      include: { scriptDrafts: true },
    });
    if (!project) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Project", id);
    }
    return project;
  };

  projectDelegate.findWithAssets = async (id: string) => {
    const project = await client.project.findUnique({
      where: { id },
      include: { assets: true },
    });
    if (!project) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Project", id);
    }
    return project;
  };

  projectDelegate.updateStatus = async (id: string, status: ProjectStatus) =>
    client.project.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

  const scriptDelegate = client.script as StoryflowPrismaClient["script"];
  scriptDelegate.findByProjectIdOrThrow = async (projectId, args) => {
    const script = await client.script.findUnique({
      where: { projectId },
      ...(args ?? {}),
    });
    if (!script) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Script", projectId);
    }
    return script;
  };

  const blueprintDelegate = client.blueprint as StoryflowPrismaClient["blueprint"];
  blueprintDelegate.findByIdOrThrow = async (id, args) => {
    const blueprint = await client.blueprint.findUnique({
      where: { id },
      ...(args ?? {}),
    });
    if (!blueprint) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Blueprint", id);
    }
    return blueprint;
  };

  const assetDelegate = client.asset as StoryflowPrismaClient["asset"];
  assetDelegate.findByIdOrThrow = async (id, args) => {
    const asset = await client.asset.findUnique({
      where: { id },
      ...(args ?? {}),
    });
    if (!asset) {
      const { NotFoundError } = await import("@/app/api/lib");
      throw new NotFoundError("Asset", id);
    }
    return asset;
  };

  return client as StoryflowPrismaClient;
}

function createPrismaClient(): StoryflowPrismaClient {
  const base = new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

  return attachExtensions(base);
}

// Keep a single prisma instance during development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as {
  storyflowPrisma?: StoryflowPrismaClient;
};

export const storyflowPrisma: StoryflowPrismaClient =
  globalForPrisma.storyflowPrisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.storyflowPrisma = storyflowPrisma;
}
