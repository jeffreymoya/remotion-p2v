import { z } from "zod";
import { deepseekChatJson } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { DocuPalette } from "../../components/docu/docu-tokens";

const NarrationOutputSchema = z.object({
  sentences: z.array(z.object({
    text: z.string().min(1),
    emphasis: z.array(z.string()).min(1).max(4),
    palette: z.enum(["cool-tech", "warm-real"]),
  })).length(20),
});

type NarrationOutput = z.infer<typeof NarrationOutputSchema>;

const SYSTEM_PROMPT = `You are a Bloomberg-style documentary script writer. Produce exactly 20 fact-packed, declarative sentences for a short-form documentary narration.

## Rules
1. Exactly 20 sentences, 6–15 words each, declarative, verb-driven.
2. Permitted prosody: em-dash (—) for appositive contrast only (e.g. "9.1 percent — the highest in 40 years"). No ... or () — TTS cannot render pause marks reliably.
3. Numbers MUST be digits: "$800", "9.1%", "2022" — never spelled out.
4. Fact-first: open with year, institution, dollar amount, or person name.
5. 20-sentence arc skeleton:
   - Sentences 1–3: hook (grab attention with a surprising fact or consequence)
   - Sentences 4–8: mechanism (explain how the system/process works)
   - Sentences 9–13: dated event (concrete historical or recent data point)
   - Sentences 14–17: human consequence (how real people are affected)
   - Sentences 18–20: viewer lens (why this matters to the viewer)
6. Reference at least 8 of the injected verified anchors; paraphrase (do not quote verbatim).
7. Each sentence gets a "palette": "cool-tech" for institutions/data/finance/charts, "warm-real" for human consequences/homes/streets/people.
8. Each sentence gets 1-4 "emphasis" words — the most salient content words to highlight in captions.

## Output
Return JSON only, no markdown fences. Shape:
{ "sentences": [{ "text": "...", "emphasis": ["word1", "word2"], "palette": "cool-tech" }, ...] }`;

export async function generateNarration(
  topic: string,
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<SentenceDef[]> {
  const verified = anchors.filter((a) => a.status === "verified").slice(0, 20);
  const anchorLines = verified.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const userPrompt = `Topic: ${topic}

Verified research anchors (use at least 8, paraphrase — do not quote verbatim):
${anchorLines || "(no verified anchors available — rely on general knowledge)"}

Generate exactly 20 Bloomberg-style documentary sentences following the arc skeleton.`;

  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: attempt === 1 ? userPrompt : `${userPrompt}\n\nPrevious attempt produced an incorrect number of sentences. Produce exactly 20.` },
      ];

      const result: NarrationOutput = await deepseekChatJson(
        messages,
        NarrationOutputSchema,
        CODE_GEN_TEMPERATURE,
        NARRATION_REASONING,
        { runName: "docu/narration", verbose: opts?.verbose },
      );

      return result.sentences.map((s) => ({
        text: s.text,
        emphasis: s.emphasis,
        palette: s.palette as DocuPalette,
      }));
    } catch (err) {
      lastError = err;
      if (attempt <= maxRetries) {
        process.stderr.write(`[docu/narration] attempt ${attempt} failed, retrying...\n`);
        continue;
      }
    }
  }

  throw lastError;
}
