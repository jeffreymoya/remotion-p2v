import { z } from "zod";
import { traceableChain, textOnlyAssetSummary } from "../tracing";
import { callStructured } from "./llm-client";
import { LLM_NARRATION, NARRATION_BATCH_SIZE } from "../config";
import { llmNarrationSegmentPrompt } from "../prompts";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { SceneSpec } from "./segment-types";
import type { DocuPalette } from "../../components/docu/docu-tokens";
import { normalizeToken } from "./overlays/anchor-strategies";

// ── Narration style gate (deterministic lint) ─────────────────────────

export const SPELLED_OUT_NUMBER_WORDS_RE =
  /\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|million|billion|trillion)\b/i;

export const FORBIDDEN_PUNCTUATION_RE = /\.{3}|[()]/;

export const DISALLOWED_DASH_RE = /--|–/;

export interface StyleViolation {
  index: number;
  text: string;
  rules: string[];
}

export function validateNarrationStyle(sentences: SentenceDef[]): StyleViolation[] {
  const violations: StyleViolation[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i];
    const rules: string[] = [];

    const wordCount = sent.text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3 || wordCount > 20) {
      rules.push("word-count");
    }

    if (SPELLED_OUT_NUMBER_WORDS_RE.test(sent.text) && !/\d/.test(sent.text)) {
      rules.push("spelled-number");
    }

    if (FORBIDDEN_PUNCTUATION_RE.test(sent.text)) {
      rules.push("forbidden-punctuation");
    }

    if (DISALLOWED_DASH_RE.test(sent.text)) {
      rules.push("disallowed-dash");
    }

    const normalizedText = sent.text.split(/\s+/).map(normalizeToken).filter(Boolean);
    for (const emp of sent.emphasis) {
      const empTokens = emp.split(/\s+/).map(normalizeToken).filter(Boolean);
      if (empTokens.length === 0) {
        rules.push("emphasis-not-found");
        continue;
      }
      let found = false;
      for (let ti = 0; ti <= normalizedText.length - empTokens.length; ti++) {
        let matched = true;
        for (let ej = 0; ej < empTokens.length; ej++) {
          if (normalizedText[ti + ej] !== empTokens[ej]) {
            matched = false;
            break;
          }
        }
        if (matched) {
          found = true;
          break;
        }
      }
      if (!found) {
        rules.push("emphasis-not-found");
      }
    }

    if (rules.length > 0) {
      violations.push({ index: i, text: sent.text, rules });
    }
  }

  return violations;
}

const SENTENCE_SCHEMA = z.object({
  text: z.string().min(1),
  emphasis: z.array(z.string()).min(1).max(4),
});

function narrationSchema(batchSize: number) {
  return z.object({
    sentences: z.array(SENTENCE_SCHEMA).length(batchSize),
  });
}

function buildSegmentSystemPrompt(
  scene: SceneSpec,
  assignedAnchors: readonly Anchor[],
  batchSize: number,
  isQuoteScene: boolean,
  hasClipHandoff?: boolean,
  clipPersonName?: string,
  opener?: string,
): string {
  return llmNarrationSegmentPrompt({
    role: scene.arcRole,
    title: scene.title,
    intent: scene.intent,
    anchorCount: assignedAnchors.length,
    batchSize,
    scenarioPressure: scene.scenarioPressure,
    retentionLoop: scene.retentionLoop,
    visualBeat: scene.visualBeat,
    device: scene.device,
    pronoun: scene.pronoun,
    emotionalRegister: scene.emotionalRegister,
    isQuoteScene,
    hasClipHandoff,
    clipPersonName,
    opener,
  });
}

function anchorToLines(anchors: readonly Anchor[]): string {
  return anchors.map((a, i) => {
    const head = `[anc-${i + 1}] (${a.kind}${a.sourceTier ? `, ${a.sourceTier}` : ""}) ${a.claim} / ${a.detail}`;
    const attr = [
      a.attribution.person ? `person: ${a.attribution.person}` : null,
      a.attribution.year ? `year: ${a.attribution.year}` : null,
    ].filter(Boolean).join(", ");
    const quoteVerbatimBlocked = a.quote && a.citation.quoteVerbatimVerified === false;
    const quote = a.quote && !quoteVerbatimBlocked
      ? `\n    VERBATIM QUOTE${a.citation.quoteVerbatimVerified ? " (verified)" : ""}: "${a.quote}"`
      : quoteVerbatimBlocked
        ? `\n    QUOTE DISABLED (not verbatim-verified): "${a.quote}"`
        : "";
    return `${head}${attr ? ` / ${attr}` : ""}${quote}`;
  }).join("\n");
}

function mapToSentenceDefs(
  sentences: Array<{ text: string; emphasis: string[] }>,
  palette: DocuPalette,
): SentenceDef[] {
  return sentences.map((s) => ({
    text: s.text,
    emphasis: s.emphasis,
    palette,
  }));
}

function allSentenceContext(sentences: SentenceDef[]): string {
  return sentences.map((s) => s.text).join(" ");
}

export interface SegmentNarrationOpts {
  verbose?: boolean;
  isQuoteScene?: boolean;
  clipCandidateAnchorIds?: string[];
  opener?: string;
}

async function generateSegmentNarration_impl(
  topic: string,
  scene: SceneSpec,
  assignedAnchors: readonly Anchor[],
  priorSegmentContext: string,
  opts?: SegmentNarrationOpts,
): Promise<SentenceDef[]> {
  const targetCount = scene.targetSentenceCount;
  const batchSizes: number[] = [];
  let remaining = targetCount;

  while (remaining > 0) {
    const size = Math.min(remaining, NARRATION_BATCH_SIZE);
    batchSizes.push(size);
    remaining -= size;
  }

  const verified = assignedAnchors.filter((a) => a.status === "verified");
  const allSentences: SentenceDef[] = [];
  const isQuoteScene = opts?.isQuoteScene ?? false;

  const clipAnchorIds = new Set(opts?.clipCandidateAnchorIds ?? []);
  const clipAnchor = verified.find(
    (a) => clipAnchorIds.has(a.id) && a.attribution.person
  );
  const hasClipHandoff = clipAnchor != null;
  const clipPersonName = clipAnchor?.attribution.person;

  for (let bi = 0; bi < batchSizes.length; bi++) {
    const batchSize = batchSizes[bi];
    const system = buildSegmentSystemPrompt(
      scene, verified, batchSize, isQuoteScene,
      hasClipHandoff && bi === batchSizes.length - 1,
      clipPersonName,
      opts?.opener,
    );

    let priorContext: string;
    if (bi === 0 && priorSegmentContext) {
      priorContext = priorSegmentContext;
    } else if (allSentences.length > 0) {
      priorContext = allSentenceContext(allSentences);
    } else {
      priorContext = "";
    }

    const userPrompt = `Topic: ${topic}
Scene: ${scene.title} (${scene.arcRole})
Scene intent: ${scene.intent}
Batch ${bi + 1} of ${batchSizes.length}: produce exactly ${batchSize} sentences.
${priorContext ? `\nContinue naturally from prior context: "${priorContext}"` : ""}
${bi === 0 && !priorContext ? `\nThis is the first batch of the scene — establish the scene's opening.` : ""}

Research anchors:
${anchorToLines(verified)}`;

    const result = await callStructured({
      schema: narrationSchema(batchSize),
      system,
      prompt: userPrompt,
      runName: `docu/narration/seg-${String(scene.index).padStart(2, "0")}-batch-${bi + 1}`,
      verbose: opts?.verbose,
      llm: LLM_NARRATION,
    });

    allSentences.push(...mapToSentenceDefs(result.sentences, scene.palette as DocuPalette));
  }

  if (allSentences.length !== targetCount) {
    throw new Error(
      `Scene ${scene.index} narration: expected ${targetCount} sentences but got ${allSentences.length}`,
    );
  }

  return allSentences;
}

export const generateSegmentNarration = traceableChain(generateSegmentNarration_impl, "generateSegmentNarration", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => (textOnlyAssetSummary(outputs) as Record<string, unknown>) ?? {},
});
