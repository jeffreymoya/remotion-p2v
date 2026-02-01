import { randomUUID } from "node:crypto";

export function createId(prefix: string = "test"): string {
  return `${prefix}-${randomUUID()}`;
}

export function now(): Date {
  return new Date();
}

export function mergeFactory<T>(defaults: T, overrides: Partial<T> = {}): T {
  return { ...defaults, ...overrides };
}
