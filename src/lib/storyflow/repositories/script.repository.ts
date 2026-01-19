/**
 * Script Repository
 *
 * Data access layer for Script model operations.
 */

import type { Script, Prisma } from "@/src/generated/storyflow";
import { getPrismaClient } from "./base";
import type { ScriptSegment, WordTimestamp } from "../types";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateScriptInput {
  projectId: string;
  title: string;
  segments: ScriptSegment[];
  timestamps?: WordTimestamp[];
  blueprintId?: string;
}

export interface UpdateScriptInput {
  title?: string;
  segments?: ScriptSegment[];
  timestamps?: WordTimestamp[];
  blueprintId?: string;
}

// =============================================================================
// REPOSITORY
// =============================================================================

/**
 * Find a script by ID
 */
export async function findScriptById(id: string): Promise<Script | null> {
  const prisma = getPrismaClient();
  return prisma.script.findUnique({
    where: { id },
  });
}

/**
 * Find a script by project ID
 */
export async function findScriptByProjectId(
  projectId: string
): Promise<Script | null> {
  const prisma = getPrismaClient();
  return prisma.script.findUnique({
    where: { projectId },
  });
}

/**
 * Create or update a script for a project (upsert)
 */
export async function upsertScript(data: CreateScriptInput): Promise<Script> {
  const prisma = getPrismaClient();
  return prisma.script.upsert({
    where: { projectId: data.projectId },
    create: {
      projectId: data.projectId,
      title: data.title,
      segments: data.segments as unknown as Prisma.InputJsonValue,
      timestamps: data.timestamps as unknown as Prisma.InputJsonValue,
      blueprintId: data.blueprintId,
    },
    update: {
      title: data.title,
      segments: data.segments as unknown as Prisma.InputJsonValue,
      timestamps: data.timestamps as unknown as Prisma.InputJsonValue,
      blueprintId: data.blueprintId,
    },
  });
}

/**
 * Update a script
 */
export async function updateScript(
  id: string,
  data: UpdateScriptInput
): Promise<Script> {
  const prisma = getPrismaClient();
  return prisma.script.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.segments && {
        segments: data.segments as unknown as Prisma.InputJsonValue,
      }),
      ...(data.timestamps && {
        timestamps: data.timestamps as unknown as Prisma.InputJsonValue,
      }),
      ...(data.blueprintId && { blueprintId: data.blueprintId }),
    },
  });
}

/**
 * Update script segments only
 */
export async function updateScriptSegments(
  projectId: string,
  segments: ScriptSegment[]
): Promise<Script> {
  const prisma = getPrismaClient();
  return prisma.script.update({
    where: { projectId },
    data: {
      segments: segments as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Delete a script
 */
export async function deleteScript(id: string): Promise<Script> {
  const prisma = getPrismaClient();
  return prisma.script.delete({
    where: { id },
  });
}

/**
 * Delete script by project ID
 */
export async function deleteScriptByProjectId(projectId: string): Promise<Script> {
  const prisma = getPrismaClient();
  return prisma.script.delete({
    where: { projectId },
  });
}

/**
 * Get script segments as typed array
 */
export function getScriptSegments(script: Script): ScriptSegment[] {
  return (script.segments as unknown as ScriptSegment[]) || [];
}

/**
 * Get script timestamps as typed array
 */
export function getScriptTimestamps(script: Script): WordTimestamp[] {
  return (script.timestamps as unknown as WordTimestamp[]) || [];
}
