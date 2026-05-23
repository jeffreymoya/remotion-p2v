import { z } from "zod";
import { deepseekChatJson } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { OverlaySpec } from "./overlay-resolver";
import { normalizeToken } from "./overlay-resolver";
import type { DocuPalette } from "../../components/docu/docu-tokens";

const OverlayOutputSchema = z.object({
  overlays: z.array(z.object({
    type: z.enum(["headline-card", "kinetic-number"]),
    text: z.string().min(1),
    value: z.number().optional(),
    unit: z.enum(["$", "%", "x", "T", "B"]).optional(),
    source: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  })).min(3).max(6),
});

type OverlayOutput = z.infer<typeof OverlayOutputSchema>;

const SYSTEM_PROMPT = `You are a documentary overlay designer. Given 20 Bloomberg-style narration sentences and verified research anchors, produce 3–6 data-driven overlays (headline cards and kinetic numbers) that amplify key facts.

## Rules
1. 3–6 overlays total; place at sentences 4–17 (data-dense, not hook or lens).
2. anchorPhrase MUST be 1–4 consecutive words copied VERBATIM from the sentence list provided below. Prefer 1–2 word anchors — TTS may merge adjacent words (e.g. "9.1 percent" → single spoken token), so shorter anchors are more reliable.
3. Do NOT include trailing unit words ("percent", "dollars", "million", "billion", "trillion") in anchorPhrase if the number already carries the meaning — anchor on the number or the content word before it.
4. Mix: ~60% kinetic-number (stats/rates/dollar amounts with a value+unit), ~40% headline-card (event labels, institution names, with a source attribution).
5. holdSec: 3.0–4.5 seconds.
6. Kinetic numbers must include "value" (the numeric amount) and "unit" ($, %, x, T, or B).
7. Headline cards should include "source" with attribution when available from the research anchors.
8. Each overlay gets a "palette": "cool-tech" for institutional/data/financial content, "warm-real" for human-impact content.

## Output
Return JSON only, no markdown fences.
Shape: { "overlays": [{ "type": "kinetic-number", "text": "FEDERAL FUNDS RATE", "value": 5.25, "unit": "%", "palette": "cool-tech", "anchorPhrase": "federal funds rate", "holdSec": 3.0 }, ...] }`;

function buildSentenceList(sentences: SentenceDef[]): string {
  return sentences.map((s, i) => `[sent-${i + 1}] "${s.text}"`).join("\n");
}

function validateAnchorPhrases(
  overlays: Array<{ anchorPhrase: string }>,
  sentences: SentenceDef[],
): string[] {
  const corpus = sentences.map((s) =>
    s.text.split(/\s+/).map(normalizeToken).filter(Boolean)
  );

  const invalid: string[] = [];

  for (const overlay of overlays) {
    const phraseTokens = overlay.anchorPhrase
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean);

    if (phraseTokens.length === 0) {
      invalid.push(overlay.anchorPhrase);
      continue;
    }

    let found = false;
    for (const sentTokens of corpus) {
      for (let i = 0; i <= sentTokens.length - phraseTokens.length; i++) {
        let match = true;
        for (let j = 0; j < phraseTokens.length; j++) {
          if (sentTokens[i + j] !== phraseTokens[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      invalid.push(overlay.anchorPhrase);
    }
  }

  return invalid;
}

export async function generateOverlays(
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  const verified = anchors.filter((a) => a.status === "verified").slice(0, 20);
  const anchorLines = verified.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const sentenceList = buildSentenceList(sentences);

  const baseUserPrompt = `Narration sentences:\n${sentenceList}\n\nResearch anchors:\n${anchorLines || "(no verified anchors)"}\n\nProduce 3–6 overlays placed at sentences 4–17. Remember: anchorPhrase MUST be a verbatim substring from the sentences above.`;

  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let rawOverlays: OverlayOutput;
    try {
      const userExtra = attempt > 1
        ? `${baseUserPrompt}\n\nPrevious anchorPhrase values were not found verbatim in the sentences. Ensure every anchorPhrase is copied exactly from the sentence list above.`
        : baseUserPrompt;

      rawOverlays = await deepseekChatJson(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userExtra },
        ],
        OverlayOutputSchema,
        CODE_GEN_TEMPERATURE,
        NARRATION_REASONING,
        { runName: "docu/overlay", verbose: opts?.verbose },
      );
    } catch (err) {
      lastError = err;
      if (attempt <= maxRetries) {
        process.stderr.write(`[docu/overlay] LLM call failed on attempt ${attempt}, retrying...\n`);
        continue;
      }
      throw lastError;
    }

    const invalid = validateAnchorPhrases(rawOverlays.overlays, sentences);

    if (invalid.length === 0) {
      return rawOverlays.overlays.map((o) => ({
        type: o.type,
        text: o.text,
        value: o.value,
        unit: o.unit,
        source: o.source,
        palette: o.palette as DocuPalette,
        anchorPhrase: o.anchorPhrase,
        holdSec: o.holdSec,
        leadSec: o.leadSec,
      }));
    }

    if (attempt <= maxRetries) {
      process.stderr.write(
        `[docu/overlay] invalid anchorPhrases: ${invalid.join(", ")}. Retrying...\n`,
      );
      // fall through to retry (user prompt already includes fix instruction on retries)
    } else {
      // After 2 failed retries: drop invalid overlays, log warning
      const invalidSet = new Set(invalid);
      const validOverlays = rawOverlays.overlays.filter(
        (o) => !invalidSet.has(o.anchorPhrase),
      );
      if (validOverlays.length === 0) {
        throw new Error(
          `[docu/overlay] All overlays had invalid anchorPhrases after ${maxRetries + 1} attempts. Invalid: ${invalid.join(", ")}`,
        );
      }
      console.warn(
        `[docu/overlay] Dropping ${rawOverlays.overlays.length - validOverlays.length} overlays with invalid anchorPhrases after retries exhausted`,
      );
      return validOverlays.map((o) => ({
        type: o.type,
        text: o.text,
        value: o.value,
        unit: o.unit,
        source: o.source,
        palette: o.palette as DocuPalette,
        anchorPhrase: o.anchorPhrase,
        holdSec: o.holdSec,
        leadSec: o.leadSec,
      }));
    }
  }

  throw lastError;
}
