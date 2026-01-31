import { PrismaClient } from "../../generated/storyflow/client";
import { env } from "@/src/env";
import { projectExtension } from "@/src/lib/storyflow/prisma-extensions";

type StoryflowPrismaClient = ReturnType<PrismaClient["$extends"]>;

// Keep a single prisma instance during development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as {
  storyflowPrisma?: StoryflowPrismaClient;
};

const prismaClient: StoryflowPrismaClient =
  globalForPrisma.storyflowPrisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  }).$extends(projectExtension);

export const storyflowPrisma = prismaClient;

if (env.NODE_ENV !== "production") {
  globalForPrisma.storyflowPrisma = storyflowPrisma;
}
