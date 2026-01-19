import { PrismaClient } from "../../generated/storyflow/client";

// Keep a single prisma instance during development to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as {
  storyflowPrisma?: PrismaClient;
};

export const storyflowPrisma =
  globalForPrisma.storyflowPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.storyflowPrisma = storyflowPrisma;
}
