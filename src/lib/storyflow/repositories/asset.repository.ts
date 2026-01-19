/**
 * Asset Repository
 *
 * Data access layer for Asset model operations.
 */

import type { Asset, AssetType, Prisma } from "@/src/generated/storyflow";
import { getPrismaClient } from "./base";

// =============================================================================
// TYPES
// =============================================================================

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  format?: string;
  codec?: string;
  bitrate?: number;
  mode?: string;
}

export interface CreateAssetInput {
  projectId: string;
  type: AssetType;
  filename: string;
  path: string;
  metadata?: AssetMetadata;
}

export interface UpdateAssetInput {
  filename?: string;
  path?: string;
  metadata?: AssetMetadata;
  upscaled?: boolean;
  upscaledPath?: string;
}

export interface AssetListOptions {
  projectId?: string;
  type?: AssetType;
  skip?: number;
  take?: number;
}

// =============================================================================
// REPOSITORY
// =============================================================================

/**
 * Find an asset by ID
 */
export async function findAssetById(id: string): Promise<Asset | null> {
  const prisma = getPrismaClient();
  return prisma.asset.findUnique({
    where: { id },
  });
}

/**
 * Find assets by project ID
 */
export async function findAssetsByProjectId(
  projectId: string,
  type?: AssetType
): Promise<Asset[]> {
  const prisma = getPrismaClient();
  return prisma.asset.findMany({
    where: {
      projectId,
      ...(type && { type }),
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Find assets with filtering and pagination
 */
export async function findManyAssets(options: AssetListOptions = {}): Promise<Asset[]> {
  const prisma = getPrismaClient();
  const { projectId, type, skip, take } = options;

  return prisma.asset.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(type && { type }),
    },
    skip,
    take,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Create a new asset
 */
export async function createAsset(data: CreateAssetInput): Promise<Asset> {
  const prisma = getPrismaClient();
  return prisma.asset.create({
    data: {
      projectId: data.projectId,
      type: data.type,
      filename: data.filename,
      path: data.path,
      metadata: data.metadata as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Update an asset
 */
export async function updateAsset(id: string, data: UpdateAssetInput): Promise<Asset> {
  const prisma = getPrismaClient();
  return prisma.asset.update({
    where: { id },
    data: {
      ...(data.filename && { filename: data.filename }),
      ...(data.path && { path: data.path }),
      ...(data.metadata && {
        metadata: data.metadata as unknown as Prisma.InputJsonValue,
      }),
      ...(data.upscaled !== undefined && { upscaled: data.upscaled }),
      ...(data.upscaledPath && { upscaledPath: data.upscaledPath }),
    },
  });
}

/**
 * Mark an asset as upscaled
 */
export async function markAssetUpscaled(
  id: string,
  upscaledPath: string
): Promise<Asset> {
  const prisma = getPrismaClient();
  return prisma.asset.update({
    where: { id },
    data: {
      upscaled: true,
      upscaledPath,
    },
  });
}

/**
 * Delete an asset
 */
export async function deleteAsset(id: string): Promise<Asset> {
  const prisma = getPrismaClient();
  return prisma.asset.delete({
    where: { id },
  });
}

/**
 * Delete all assets for a project
 */
export async function deleteAssetsByProjectId(projectId: string): Promise<number> {
  const prisma = getPrismaClient();
  const result = await prisma.asset.deleteMany({
    where: { projectId },
  });
  return result.count;
}

/**
 * Count assets by project and optionally by type
 */
export async function countAssets(
  projectId: string,
  type?: AssetType
): Promise<number> {
  const prisma = getPrismaClient();
  return prisma.asset.count({
    where: {
      projectId,
      ...(type && { type }),
    },
  });
}

/**
 * Get asset metadata as typed object
 */
export function getAssetMetadata(asset: Asset): AssetMetadata | null {
  return (asset.metadata as unknown as AssetMetadata) || null;
}
