import type {
  Asset,
  Project,
  ProjectStatus,
  Render,
  Script,
} from "@/src/lib/storyflow/types";

import { createId, mergeFactory, now } from "./base";
import { buildAsset } from "./asset";
import { buildRender } from "./render";
import { buildScript } from "./script";

export const ALL_PROJECT_STATUSES: ProjectStatus[] = [
  "DRAFT",
  "SCRIPT_READY",
  "ASSETS_READY",
  "VIEWPORT_READY",
  "BOARDS_READY",
  "RENDER_READY",
  "RENDERING",
  "COMPLETED",
  "ERROR",
];

export function buildProject(overrides: Partial<Project> = {}): Project {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();

  const defaults: Project = {
    id: overrides.id ?? createId("project"),
    name: "Test Project",
    topic: null,
    status: "DRAFT",
    aspectRatio: "16:9",
    createdAt,
    updatedAt,
    assetMappings: null,
  };

  return mergeFactory(defaults, overrides);
}

export function buildProjectWithScript(
  overrides: Partial<Project & { script: Script }> = {}
): Project & { script: Script } {
  const project = buildProject(overrides);
  const script =
    overrides.script ?? buildScript({ projectId: project.id, id: createId("script") });

  return {
    ...project,
    script,
  };
}

export function buildProjectWithAssets(
  overrides: Partial<Project & { assets: Asset[] }> = {},
  assetOverrides: Partial<Asset>[] = []
): Project & { assets: Asset[] } {
  const project = buildProject(overrides);
  const assets =
    overrides.assets ??
    (assetOverrides.length
      ? assetOverrides.map((asset) => buildAsset({ projectId: project.id, ...asset }))
      : [buildAsset({ projectId: project.id })]);

  return {
    ...project,
    assets,
  };
}

export function buildProjectWithRender(
  overrides: Partial<Project & { renders: Render[] }> = {},
  renderOverrides: Partial<Render>[] = []
): Project & { renders: Render[] } {
  const project = buildProject(overrides);
  const renders =
    overrides.renders ??
    (renderOverrides.length
      ? renderOverrides.map((render) => buildRender({ projectId: project.id, ...render }))
      : [buildRender({ projectId: project.id })]);

  return {
    ...project,
    renders,
  };
}
