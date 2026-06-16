import { traceableChain, textOnlyAssetSummary } from "../tracing";
import { callStructured } from "./llm-client";
import type { SentenceDef } from "./tts-pipeline";
import type { DataItem } from "./overlays/types";
import type { DocuSegmentPlan } from "./segment-types";
import type { Anchor } from "../shared/research/research-schema";
import { zScenePlan, type ScenePlan } from "../pipeline/schemas";
import { loadComponentCatalog, selectableComponents } from "./component-catalog";
import {
  DEFAULT_BALANCE_CONFIG,
  formatBalanceFeedback,
  gateComponentBalance,
  hasBalanceViolations,
} from "./component-balance-gate";

export const MAX_BALANCE_RETRIES = 2;

interface GenerateScenePlanInput {
  segments: DocuSegmentPlan[];
  sentences: SentenceDef[];
  anchors: Anchor[];
  dataItems: DataItem[];
  varietyTargets?: { minDistinctFamilies?: number };
}

function sentenceWindows(segments: DocuSegmentPlan[], sentences: SentenceDef[]): Array<{ start: number; end: number; text: string }> {
  const windows: Array<{ start: number; end: number; text: string }> = [];
  let offset = 0;
  for (const segment of segments) {
    const start = offset;
    const end = Math.min(sentences.length, offset + segment.targetSentenceCount);
    windows.push({
      start,
      end: Math.max(start, end - 1),
      text: sentences.slice(start, end).map((sentence) => sentence.text).join(" "),
    });
    offset = end;
  }
  return windows;
}

function sceneRoleHint(role: DocuSegmentPlan["role"]): string {
  if (role === "consequence" || role === "build") return "turn";
  return role ?? "custom";
}

function buildPrompt(input: GenerateScenePlanInput, retryFeedback: string | null): string {
  const catalog = selectableComponents(loadComponentCatalog());
  const windows = sentenceWindows(input.segments, input.sentences);
  const componentBrief = catalog.map((entry) => (
    `- ${entry.name} (${entry.category}): ${entry.purpose} Use when: ${entry.whenToUse}. Cues: ${entry.scriptCues.join(", ")}.`
  )).join("\n");

  const scenes = input.segments.map((segment, index) => {
    const window = windows[index];
    const anchors = input.anchors.filter((anchor) => segment.assignedAnchorIds.includes(anchor.id));
    const dataItems = input.dataItems.filter((item) => segment.assignedAnchorIds.includes(item.sourceAnchorId));
    return [
      `Scene ${index} id="scene-${String(index).padStart(2, "0")}"`,
      `role=${sceneRoleHint(segment.role)} title=${segment.title}`,
      `intent=${segment.intent}`,
      `narration sentences ${window.start}-${window.end}: ${window.text}`,
      `anchors: ${anchors.map((anchor) => `${anchor.id}: ${anchor.claim}`).join(" | ") || "none"}`,
      `data items: ${dataItems.map((item) => `${item.id}: ${item.label}`).join(" | ") || "none"}`,
    ].join("\n");
  }).join("\n\n");

  const feedback = retryFeedback
    ? `\nPrevious scene plan failed validation. Regenerate with these fixes:\n${retryFeedback}\n`
    : "";

  return `Select s2v documentary components for each scene.

Rules:
- Return exactly ${input.segments.length} scenes, in the same order, one scene per listed segment.
- Each scene must have exactly one primary layer and at most three supporting layers.
- Use only components from the catalog below. Do not use DocumentaryCaption.
- Pick by meaning and available evidence; vary component families to avoid template fatigue.
- If a component needs data, use it only when the scene has relevant data items.
- Set each scene background to {"assetRef": ""}; the legacy shot pipeline remains responsible for media.
- Use slot names only when useful; otherwise omit slot and the resolver will place it.
- Keep props simple and content-based. Component defaults will fill visual styling.
- Use anchor at {"kind":"sceneStart"} unless a word-specific cue is obvious.
- Valid roles are hook, context, evidence, data, turn, payoff, cta, custom.
- Valid focalOwner values are title, evidence, chart, map, person, object, metric, custom.
- Required JSON shape:
{
  "scenes": [
    {
      "id": "scene-00",
      "role": "hook",
      "focalOwner": "title",
      "background": { "assetRef": "" },
      "layers": [
        {
          "component": "TitleCard",
          "layerRole": "primary",
          "props": { "line1": "short headline", "line2": "short subtitle" },
          "anchors": [{ "target": "enter", "at": { "kind": "sceneStart" } }]
        }
      ],
      "emphasisWordRefs": [],
      "evidenceRefs": [],
      "transition": null
    }
  ]
}
${feedback}
Component catalog:
${componentBrief}

Scenes:
${scenes}`;
}

async function generateScenePlan_impl(
  input: GenerateScenePlanInput,
  opts?: { verbose?: boolean },
): Promise<ScenePlan> {
  const catalog = loadComponentCatalog();
  const config = {
    ...DEFAULT_BALANCE_CONFIG,
    minDistinctFamilies: input.varietyTargets?.minDistinctFamilies ?? DEFAULT_BALANCE_CONFIG.minDistinctFamilies,
  };
  let retryFeedback: string | null = null;
  let lastPlan: ScenePlan | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_BALANCE_RETRIES; attempt++) {
    try {
      const plan = await callStructured({
        schema: zScenePlan,
        system: "You are a documentary visual grammar planner. Return strict JSON matching the schema.",
        prompt: buildPrompt(input, retryFeedback),
        runName: `docu/scene-plan/attempt-${attempt + 1}`,
        verbose: opts?.verbose,
      });
      lastPlan = plan;
      const result = gateComponentBalance(plan, catalog, { hasDataItems: input.dataItems.length > 0 }, config);
      if (!hasBalanceViolations(result)) {
        console.log(
          `[scene-plan] balance pass: ${result.distinctFamilies}/${result.floorTarget} families, ` +
          `${result.primaryCount} scenes`,
        );
        return plan;
      }
      retryFeedback = formatBalanceFeedback(result, config);
      process.stderr.write(`[scene-plan] balance violation on attempt ${attempt + 1}:\n${retryFeedback}\n`);
    } catch (err) {
      lastError = err;
      retryFeedback = [
        "- Return a top-level object with only a scenes array.",
        "- Every scene must include id, role, focalOwner, background, layers, emphasisWordRefs, and evidenceRefs.",
        "- Every scene must include layers as an array with exactly one primary layer.",
        "- Do not use focalOwner values like finance, system, rates, policy, money, or market.",
        "- Use only these focalOwner values: title, evidence, chart, map, person, object, metric, custom.",
      ].join("\n");
      process.stderr.write(`[scene-plan] generation attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  if (lastPlan) {
    console.warn("[scene-plan] balance violations persist after retries; proceeding");
    return lastPlan;
  }
  throw lastError ?? new Error("[scene-plan] failed to generate a scene plan");
}

export const generateScenePlan = traceableChain(generateScenePlan_impl, "generateScenePlan", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => (textOnlyAssetSummary(outputs) as Record<string, unknown>) ?? {},
}) as typeof generateScenePlan_impl;
