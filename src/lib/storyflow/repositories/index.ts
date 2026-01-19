/**
 * Repository Layer
 *
 * Provides a data access abstraction over Prisma.
 * Benefits:
 * - Encapsulates database queries
 * - Enables easy mocking for unit tests
 * - Centralizes data transformation (JSON fields -> typed objects)
 * - Isolates schema changes to repository layer
 *
 * @example
 * ```ts
 * import {
 *   findProjectById,
 *   createProject,
 *   updateProjectStatus
 * } from "@/src/lib/storyflow/repositories";
 *
 * // Use in services/API routes
 * const project = await findProjectById(id);
 * if (!project) throw new NotFoundError("Project", id);
 * ```
 *
 * @example Testing with mocks
 * ```ts
 * import { setPrismaClient, resetPrismaClient } from "@/src/lib/storyflow/repositories";
 *
 * beforeEach(() => {
 *   setPrismaClient(mockPrismaClient);
 * });
 *
 * afterEach(() => {
 *   resetPrismaClient();
 * });
 * ```
 */

// Base utilities
export {
  getPrismaClient,
  setPrismaClient,
  resetPrismaClient,
  withTransaction,
} from "./base";

// Project repository
export {
  findProjectById,
  findProjectWithRelations,
  findManyProjects,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  projectExists,
  countProjectsByStatus,
  type ProjectWithRelations,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectListOptions,
} from "./project.repository";

// Script repository
export {
  findScriptById,
  findScriptByProjectId,
  upsertScript,
  updateScript,
  updateScriptSegments,
  deleteScript,
  deleteScriptByProjectId,
  getScriptSegments,
  getScriptTimestamps,
  type CreateScriptInput,
  type UpdateScriptInput,
} from "./script.repository";

// Asset repository
export {
  findAssetById,
  findAssetsByProjectId,
  findManyAssets,
  createAsset,
  updateAsset,
  markAssetUpscaled,
  deleteAsset,
  deleteAssetsByProjectId,
  countAssets,
  getAssetMetadata,
  type AssetMetadata,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssetListOptions,
} from "./asset.repository";
