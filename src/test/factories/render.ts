import type { Render } from "@/src/lib/storyflow/types";

import { createId, mergeFactory, now } from "./base";

export function buildRender(overrides: Partial<Render> = {}): Render {
  const createdAt = overrides.createdAt ?? now();
  const startedAt = overrides.startedAt ?? createdAt;

  return mergeFactory<Render>(
    {
      id: overrides.id ?? createId("render"),
      projectId: overrides.projectId ?? createId("project"),
      quality: overrides.quality ?? "DRAFT",
      status: overrides.status ?? "PENDING",
      progress: overrides.progress ?? 0,
      outputPath: overrides.outputPath ?? null,
      error: overrides.error ?? null,
      startedAt,
      completedAt: overrides.completedAt ?? null,
      createdAt,
    },
    overrides
  );
}
