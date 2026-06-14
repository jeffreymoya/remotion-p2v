import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_JUDGE } from "../config";
import type { SentenceDef } from "./tts-pipeline";
import { traceableChain, textOnlyAssetSummary } from "../tracing";
import type { StorySpine, SceneSpec } from "./segment-types";

const MAX_RETRIES = 2;

// ── Deterministic checks ──────────────────────────────────────────────

const SETUP_OPENERS_RE = /^(welcome|today we will|today we explore|in this video|let me explain|let's talk about)/i;

export interface StructureViolation {
  check: string;
  detail: string;
}

export function normalizeOptionalQuoteScene(
  sentences: SentenceDef[],
  spine: StorySpine,
): StorySpine {
  if (spine.quoteSceneIndex === null) return spine;
  const quoteSceneViolations = checkStructureDeterministic(sentences, spine).filter(
    (v) => v.check === "quote-scene-missing-quote",
  );
  if (quoteSceneViolations.length === 0) return spine;
  return {
    ...spine,
    quoteSceneIndex: null,
  };
}

export function checkStructureDeterministic(
  sentences: SentenceDef[],
  spine: StorySpine,
): StructureViolation[] {
  const violations: StructureViolation[] = [];
  const scenes = spine.segments;

  // Partition sentences by scene
  const sceneSentences = partitionByScene(sentences, scenes);

  // 1. Hook scene must not open with setup phrases
  if (sceneSentences.length > 0 && sceneSentences[0].length > 0) {
    const hookOpener = sceneSentences[0][0].text;
    if (SETUP_OPENERS_RE.test(hookOpener)) {
      violations.push({
        check: "hook-no-setup",
        detail: `Hook opens with a setup phrase: "${hookOpener.slice(0, 60)}"`,
      });
    }
  }

  // 2. Quote scene validation
  if (spine.quoteSceneIndex !== null) {
    const qIdx = spine.quoteSceneIndex;
    if (qIdx >= 0 && qIdx < sceneSentences.length) {
      const quoteSentences = sceneSentences[qIdx];
      const hasQuotedSentence = quoteSentences.some(
        (s) => s.text.includes('"') || s.text.includes('\u201c'),
      );
      if (!hasQuotedSentence) {
        violations.push({
          check: "quote-scene-missing-quote",
          detail: `Scene ${qIdx} is quoteSceneIndex but has no quoted sentence`,
        });
      }
    }
  }

  // 3. Pronoun diversity — at least 2 different pronouns used across scenes
  const pronounsUsed = new Set(scenes.map((s) => s.pronoun));
  if (pronounsUsed.size < 2) {
    violations.push({
      check: "pronoun-diversity",
      detail: `Only one pronoun "${[...pronounsUsed][0]}" assigned across all scenes`,
    });
  }

  // 4. flipFromPrior — at least one scene
  if (!scenes.some((s) => s.flipFromPrior)) {
    violations.push({
      check: "no-flip",
      detail: "No scene has flipFromPrior: true",
    });
  }

  // 5. No empty scenes
  for (let i = 0; i < sceneSentences.length; i++) {
    if (sceneSentences[i].length === 0) {
      violations.push({
        check: "empty-scene",
        detail: `Scene ${i} ("${scenes[i]?.title ?? "unknown"}") has 0 sentences`,
      });
    }
  }

  return violations;
}

// ── LLM judge ─────────────────────────────────────────────────────────

const JudgeResponseSchema = z.object({
  arcRolesPerformed: z.boolean(),
  flipPresent: z.boolean(),
  payoffResolvesHook: z.boolean(),
  issues: z.array(z.string()),
  correctedSentences: z.array(z.object({
    sceneIndex: z.number().int().min(0),
    sentenceIndex: z.number().int().min(0),
    correctedText: z.string(),
    reason: z.string(),
  })).optional(),
});

function buildJudgePrompt(): string {
  return `You are a story-structure judge for a Bloomberg-style infotainment documentary. You receive the full script (all sentences grouped by scene) and the story spine. Judge whether:

1. Each scene performs its declared arcRole (hook=scenario entry, baseline=mechanism, escalation=obstacle→consequence, turn=reveal, payoff=resolution).
2. There is a real emotional flip at the scene marked flipFromPrior (not just a topic shift — a genuine inversion of the viewer's mental model).
3. The payoff scene resolves the hook scene's scenario pressure (the viewer's question from the opening is answered).

## Output Format (JSON only, no markdown fences)
{
  "arcRolesPerformed": true/false,
  "flipPresent": true/false,
  "payoffResolvesHook": true/false,
  "issues": ["description of each issue found"],
  "correctedSentences": [{"sceneIndex": 0, "sentenceIndex": 1, "correctedText": "...", "reason": "..."}]
}

If all pass, return arcRolesPerformed=true, flipPresent=true, payoffResolvesHook=true, issues=[], correctedSentences=[].
Only propose corrections for structural failures — do not rewrite for style or polish.`;
}

function buildJudgeUserPrompt(
  sentences: SentenceDef[],
  spine: StorySpine,
): string {
  const scenes = spine.segments;
  const sceneSentences = partitionByScene(sentences, scenes);

  const sceneBlocks = scenes.map((scene, i) => {
    const sents = sceneSentences[i] ?? [];
    const sentLines = sents.map((s, si) => `  [${si}] ${s.text}`).join("\n");
    return `## Scene ${i}: "${scene.title}" (arcRole: ${scene.arcRole}, flipFromPrior: ${scene.flipFromPrior}, pronoun: ${scene.pronoun})
Intent: ${scene.intent}
${sentLines}`;
  }).join("\n\n");

  return `## Story Spine
Primary structure: ${spine.primaryStructure}
Scenario pressure: ${spine.scenarioPressure}
Central flip: ${spine.centralFlip}
Viewer stake: ${spine.viewerStake}

## Full Script
${sceneBlocks}`;
}

export interface StoryStructureGateResult {
  passed: boolean;
  deterministicViolations: StructureViolation[];
  judgeIssues: string[];
}

async function gateStoryStructure_impl(
  sentences: SentenceDef[],
  spine: StorySpine,
  opts?: { verbose?: boolean },
): Promise<{ sentences: SentenceDef[]; result: StoryStructureGateResult }> {
  const normalizedSpine = normalizeOptionalQuoteScene(sentences, spine);
  if (normalizedSpine !== spine && opts?.verbose) {
    console.warn(
      "[story-structure-gate] quoteSceneIndex had no quoted sentence; clearing optional quote scene and continuing",
    );
  }
  // Deterministic checks — always run
  const deterministicViolations = checkStructureDeterministic(sentences, normalizedSpine);
  if (deterministicViolations.length > 0 && opts?.verbose) {
    for (const v of deterministicViolations) {
      console.warn(`[story-structure-gate/deterministic] ${v.check}: ${v.detail}`);
    }
  }

  const blockingViolations = deterministicViolations.filter(
    (v) => v.check === "empty-scene" || v.check === "no-flip" || v.check === "quote-scene-missing-quote"
  );
  if (blockingViolations.length > 0) {
    throw new Error(
      `[story-structure-gate] Blocking structural violations — aborting:\n` +
      blockingViolations.map((v) => `  ${v.check}: ${v.detail}`).join("\n")
    );
  }

  // LLM judge — bounded repair loop
  let current = [...sentences];
  let judgeIssues: string[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await callStructured({
      schema: JudgeResponseSchema,
      system: buildJudgePrompt(),
      prompt: buildJudgeUserPrompt(current, normalizedSpine),
      runName: `docu/story-structure-gate/attempt-${attempt}`,
      verbose: opts?.verbose,
      llm: LLM_JUDGE,
    });

    judgeIssues = result.issues;

    if (result.arcRolesPerformed && result.flipPresent && result.payoffResolvesHook) {
      if (opts?.verbose) {
        console.log(`[story-structure-gate] All structural checks passed (attempt ${attempt})`);
      }
      return {
        sentences: current,
        result: { passed: true, deterministicViolations, judgeIssues: [] },
      };
    }

    // Apply corrections if provided
    if (result.correctedSentences && result.correctedSentences.length > 0) {
      const scenes = spine.segments;
      const sceneSentences = partitionByScene(current, scenes);
      const next = [...current];

      for (const corr of result.correctedSentences) {
        const globalIdx = globalIndexFromSceneLocal(corr.sceneIndex, corr.sentenceIndex, scenes);
        if (globalIdx !== null && globalIdx < next.length) {
          next[globalIdx] = { ...next[globalIdx], text: corr.correctedText };
        }
      }
      current = next;

      if (opts?.verbose) {
        console.log(
          `[story-structure-gate] Attempt ${attempt}: ${result.correctedSentences.length} corrections applied ` +
          `(issues: ${result.issues.join("; ")})`,
        );
      }
    } else {
      if (opts?.verbose) {
        console.warn(
          `[story-structure-gate] Attempt ${attempt}: issues found but no corrections — proceeding ` +
          `(${result.issues.join("; ")})`,
        );
      }
      break;
    }
  }

  // Log+pass — never block the render
  if (judgeIssues.length > 0) {
    process.stderr.write(
      `[story-structure-gate] Unresolved issues after ${MAX_RETRIES} attempts: ${judgeIssues.join("; ")}\n`,
    );
  }

  return {
    sentences: current,
    result: { passed: judgeIssues.length === 0, deterministicViolations, judgeIssues },
  };
}

export const gateStoryStructure = traceableChain(gateStoryStructure_impl, "gateStoryStructure", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => (textOnlyAssetSummary(outputs) as Record<string, unknown>) ?? {},
});

// ── Helpers ───────────────────────────────────────────────────────────

function partitionByScene(
  sentences: SentenceDef[],
  scenes: SceneSpec[],
): SentenceDef[][] {
  const result: SentenceDef[][] = [];
  let offset = 0;
  for (const scene of scenes) {
    const count = scene.targetSentenceCount;
    result.push(sentences.slice(offset, offset + count));
    offset += count;
  }
  return result;
}

function globalIndexFromSceneLocal(
  sceneIndex: number,
  sentenceIndex: number,
  scenes: SceneSpec[],
): number | null {
  let offset = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (i === sceneIndex) {
      const globalIdx = offset + sentenceIndex;
      return globalIdx;
    }
    offset += scenes[i].targetSentenceCount;
  }
  return null;
}
