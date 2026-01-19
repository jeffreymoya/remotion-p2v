/**
 * Project Repository
 *
 * Data access layer for Project model operations.
 * Encapsulates all Prisma queries related to projects.
 */

import type { Project, ProjectStatus, Prisma } from "@/src/generated/storyflow";
import { getPrismaClient } from "./base";

// =============================================================================
// TYPES
// =============================================================================

export interface ProjectWithRelations extends Project {
  script?: {
    id: string;
    title: string;
    segments: unknown;
    timestamps?: unknown;
  } | null;
  assets?: Array<{
    id: string;
    type: string;
    filename: string;
    path: string;
  }>;
  viewport?: {
    id: string;
    keyframes: unknown;
    regions?: unknown;
  } | null;
  settings?: {
    id: string;
    voice: string;
    speakingRate: number;
    musicVolume: number;
  } | null;
}

export interface CreateProjectInput {
  name: string;
  topic?: string;
  aspectRatio?: string;
}

export interface UpdateProjectInput {
  name?: string;
  topic?: string;
  status?: ProjectStatus;
  aspectRatio?: string;
  assetMappings?: Prisma.InputJsonValue;
}

export interface ProjectListOptions {
  skip?: number;
  take?: number;
  status?: ProjectStatus;
  orderBy?: "createdAt" | "updatedAt" | "name";
  orderDir?: "asc" | "desc";
}

// =============================================================================
// REPOSITORY
// =============================================================================

/**
 * Find a project by ID
 */
export async function findProjectById(id: string): Promise<Project | null> {
  const prisma = getPrismaClient();
  return prisma.project.findUnique({
    where: { id },
  });
}

/**
 * Find a project by ID with all relations
 */
export async function findProjectWithRelations(
  id: string
): Promise<ProjectWithRelations | null> {
  const prisma = getPrismaClient();
  return prisma.project.findUnique({
    where: { id },
    include: {
      script: true,
      assets: true,
      viewport: true,
      settings: true,
    },
  }) as Promise<ProjectWithRelations | null>;
}

/**
 * Find many projects with optional filtering and pagination
 */
export async function findManyProjects(
  options: ProjectListOptions = {}
): Promise<Project[]> {
  const prisma = getPrismaClient();
  const { skip, take, status, orderBy = "createdAt", orderDir = "desc" } = options;

  return prisma.project.findMany({
    where: status ? { status } : undefined,
    skip,
    take,
    orderBy: { [orderBy]: orderDir },
  });
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectInput): Promise<Project> {
  const prisma = getPrismaClient();
  return prisma.project.create({
    data: {
      name: data.name,
      topic: data.topic,
      aspectRatio: data.aspectRatio ?? "16:9",
    },
  });
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  const prisma = getPrismaClient();
  return prisma.project.update({
    where: { id },
    data,
  });
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<Project> {
  const prisma = getPrismaClient();
  return prisma.project.update({
    where: { id },
    data: { status },
  });
}

/**
 * Delete a project and all related data (cascades via schema)
 */
export async function deleteProject(id: string): Promise<Project> {
  const prisma = getPrismaClient();
  return prisma.project.delete({
    where: { id },
  });
}

/**
 * Check if a project exists
 */
export async function projectExists(id: string): Promise<boolean> {
  const prisma = getPrismaClient();
  const count = await prisma.project.count({
    where: { id },
  });
  return count > 0;
}

/**
 * Count projects by status
 */
export async function countProjectsByStatus(
  status?: ProjectStatus
): Promise<number> {
  const prisma = getPrismaClient();
  return prisma.project.count({
    where: status ? { status } : undefined,
  });
}
