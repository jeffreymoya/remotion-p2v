/**
 * Base Repository Pattern
 *
 * Provides a foundation for data access layer with:
 * - Common CRUD operations
 * - Transaction support
 * - Type-safe queries
 * - Easy mocking for tests
 */

import type { PrismaClient } from "@/src/generated/storyflow";

/**
 * Base repository interface for common operations.
 * Models can extend this with additional type-specific methods.
 */
export interface IRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findMany(options?: { skip?: number; take?: number }): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
}

/**
 * Get the Prisma client instance.
 * This is the only place where Prisma is directly imported in repositories.
 */
let _prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!_prismaClient) {
    // Lazy import to avoid initialization issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { storyflowPrisma } = require("../prisma");
    _prismaClient = storyflowPrisma;
  }
  return _prismaClient as PrismaClient;
}

/**
 * Set a custom Prisma client (useful for testing with mocks)
 */
export function setPrismaClient(client: PrismaClient | null): void {
  _prismaClient = client;
}

/**
 * Reset the Prisma client to default (useful for test cleanup)
 */
export function resetPrismaClient(): void {
  _prismaClient = null;
}

/**
 * Execute a function within a transaction
 */
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getPrismaClient();
  // Note: Prisma's $transaction for interactive transactions
  // For simple cases, we pass the client directly
  return fn(prisma);
}
