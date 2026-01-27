/**
 * Type-safe Prisma JSON helpers
 *
 * Prisma stores JSON fields as JsonValue which doesn't directly cast to typed arrays.
 * These helpers provide safe serialization/deserialization with proper type assertions.
 */

import { Prisma } from "@/src/generated/storyflow";
type JsonValue = Prisma.JsonValue;

/**
 * Safely cast a JsonValue to a typed array.
 * Use this when reading JSON arrays from Prisma.
 *
 * @example
 * const segments = fromJsonArray<ScriptSegment>(script.segments);
 */
export function fromJsonArray<T>(value: JsonValue | null | undefined): T[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value as unknown as T[];
}

/**
 * Safely cast a JsonValue to a typed object.
 * Use this when reading JSON objects from Prisma.
 *
 * @example
 * const metadata = fromJsonObject<AssetMetadata>(asset.metadata);
 */
export function fromJsonObject<T>(value: JsonValue | null | undefined): T | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as unknown as T;
}

/**
 * Convert a typed array to Prisma-compatible JSON.
 * Use this when writing JSON arrays to Prisma.
 *
 * @example
 * await prisma.script.update({
 *   data: { segments: toJsonArray(segments) }
 * });
 */
export function toJsonArray<T>(value: T[] | null | undefined): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }
  // JSON.parse(JSON.stringify()) ensures the array is a plain JSON value
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Convert a typed object to Prisma-compatible JSON.
 * Use this when writing JSON objects to Prisma.
 *
 * @example
 * await prisma.asset.update({
 *   data: { metadata: toJsonObject(metadata) }
 * });
 */
export function toJsonObject<T>(value: T | null | undefined): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Convert null to Prisma.JsonNull for explicit null storage.
 * Use this when you need to store null in a JSON field.
 */
export function toJsonNull(): typeof Prisma.JsonNull {
  return Prisma.JsonNull;
}

/**
 * Handle nullable JSON values when writing to Prisma.
 * Converts null to Prisma.JsonNull and values to InputJsonValue.
 */
export function toNullableJson<T>(value: T | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
