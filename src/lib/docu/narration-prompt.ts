import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_NARRATION, NARRATION_BATCH_SIZE } from "../config";
import { llmNarrationSegmentPrompt } from "../prompts";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { DocuSegmentPlan } from "./segment-types";
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

    // word-count: must be in [6, 15]
    const wordCount = sent.text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 6 || wordCount > 15) {
      rules.push("word-count");
    }

    // spelled-number: spelled-out number with no digit in text
    if (SPELLED_OUT_NUMBER_WORDS_RE.test(sent.text) && !/\d/.test(sent.text)) {
      rules.push("spelled-number");
    }

    // forbidden-punctuation: ellipsis or parens
    if (FORBIDDEN_PUNCTUATION_RE.test(sent.text)) {
      rules.push("forbidden-punctuation");
    }

    // disallowed-dash: double-hyphen or en-dash
    if (DISALLOWED_DASH_RE.test(sent.text)) {
      rules.push("disallowed-dash");
    }

    // emphasis-not-found: each emphasis item must match the sentence text
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
  palette: z.enum(["cool-tech", "warm-real"]),
});

function narrationSchema(batchSize: number) {
  return z.object({
    sentences: z.array(SENTENCE_SCHEMA).length(batchSize),
  });
}

function buildSegmentSystemPrompt(
  plan: DocuSegmentPlan,
  assignedAnchors: readonly Anchor[],
  batchSize: number,
): string {
  return llmNarrationSegmentPrompt({
    role: plan.role,
    title: plan.title,
    intent: plan.intent,
    anchorCount: assignedAnchors.length,
    batchSize,
  });
}

function anchorToLines(anchors: readonly Anchor[]): string {
  return anchors.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");
}

function mapToSentenceDefs(
  sentences: Array<{ text: string; emphasis: string[]; palette: string }>,
): SentenceDef[] {
  return sentences.map((s) => ({
    text: s.text,
    emphasis: s.emphasis,
    palette: s.palette as DocuPalette,
  }));
}

function lastNSentences(sentences: SentenceDef[], n: number): string {
  return sentences.slice(-n).map((s) => s.text).join(" ");
}

export async function generateSegmentNarration(
  topic: string,
  plan: DocuSegmentPlan,
  assignedAnchors: readonly Anchor[],
  priorSegmentContext: string,
  opts?: { verbose?: boolean },
): Promise<SentenceDef[]> {
  const targetCount = plan.targetSentenceCount;
  const batchSizes: number[] = [];
  let remaining = targetCount;

  while (remaining > 0) {
    const size = Math.min(remaining, NARRATION_BATCH_SIZE);
    batchSizes.push(size);
    remaining -= size;
  }

  const verified = assignedAnchors.filter((a) => a.status === "verified");
  const allSentences: SentenceDef[] = [];

  for (let bi = 0; bi < batchSizes.length; bi++) {
    const batchSize = batchSizes[bi];
    const system = buildSegmentSystemPrompt(plan, verified, batchSize);

    let priorContext: string;
    if (bi === 0 && priorSegmentContext) {
      priorContext = priorSegmentContext;
    } else if (allSentences.length > 0) {
      priorContext = lastNSentences(allSentences, 2);
    } else {
      priorContext = "";
    }

    const userPrompt = `Topic: ${topic}
Segment: ${plan.title} (${plan.role})
Segment intent: ${plan.intent}
Batch ${bi + 1} of ${batchSizes.length}: produce exactly ${batchSize} sentences.
${priorContext ? `\nContinue naturally from prior context: "${priorContext}"` : ""}
${bi === 0 && !priorContext ? `\nThis is the first batch of the segment — establish the segment's opening.` : ""}

Research anchors:
${anchorToLines(verified)}`;

    const result = await callStructured({
      schema: narrationSchema(batchSize),
      system,
      prompt: userPrompt,
      runName: `docu/narration/seg-${String(plan.index).padStart(2, "0")}-batch-${bi + 1}`,
      verbose: opts?.verbose,
      llm: LLM_NARRATION,
    });

    allSentences.push(...mapToSentenceDefs(result.sentences));
  }

  if (allSentences.length !== targetCount) {
    throw new Error(
      `Segment ${plan.index} narration: expected ${targetCount} sentences but got ${allSentences.length}`,
    );
  }

  return allSentences;
}
