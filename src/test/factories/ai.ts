import type { AiCallContext, AiCallResult } from "@/src/lib/services/ai/ai-logger";
import type { GeminiResponse } from "@/src/lib/viewport-types";

import { createId, mergeFactory } from "./base";

export function buildAiCallContext(
  overrides: Partial<AiCallContext> = {}
): AiCallContext {
  return mergeFactory<AiCallContext>(
    {
      projectId: overrides.projectId ?? createId("project"),
      provider: overrides.provider ?? "gemini-cli",
      model: overrides.model ?? "gemini-2.5-pro",
      operation: overrides.operation ?? "script/generate",
      parentId: overrides.parentId,
      metadata: overrides.metadata ?? { promptTokens: 10 },
    },
    overrides
  );
}

export function buildAiCallResult<T = Record<string, unknown>>(
  overrides: Partial<AiCallResult<T>> = {},
  data?: T
): AiCallResult<T> {
  return mergeFactory<AiCallResult<T>>(
    {
      data: overrides.data ?? data ?? ({} as T),
      logId: overrides.logId ?? createId("ai-log"),
      durationMs: overrides.durationMs ?? 1200,
      tokens:
        overrides.tokens ?? {
          prompt: 120,
          response: 240,
        },
      rawResponse: overrides.rawResponse ?? JSON.stringify(overrides.data ?? data ?? {}),
    },
    overrides
  );
}

export function buildGeminiResponse(
  overrides: Partial<GeminiResponse> = {}
): GeminiResponse {
  const regions =
    overrides.regions ??
    [
      {
        id: "region-1",
        label: "Subject",
        bounds: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 },
        salience: 0.9,
      },
      {
        id: "region-2",
        label: "Context",
        bounds: { x: 0.45, y: 0.2, width: 0.3, height: 0.35 },
        salience: 0.6,
      },
      {
        id: "region-3",
        label: "Accent",
        bounds: { x: 0.2, y: 0.55, width: 0.2, height: 0.25 },
        salience: 0.5,
      },
    ];

  return mergeFactory<GeminiResponse>(
    {
      regions,
      segmentGroups:
        overrides.segmentGroups ??
        [
          {
            segmentIndices: [0],
            regionId: regions[0].id,
            tone: "dramatic",
            focusReason: "Introduce main subject",
          },
          {
            segmentIndices: [1],
            regionId: regions[1].id,
            tone: "narrative",
            focusReason: "Show supporting context",
          },
        ],
    },
    overrides
  );
}
