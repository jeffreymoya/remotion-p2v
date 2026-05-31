import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_IMAGE_QUERY } from "../config";
import { llmSegmentImageQueryPrompt } from "../prompts";
import type { ImageQuery } from "./image-pipeline";
import type { DocuSegmentPlan } from "./segment-types";

// ── Image-query style gate (deterministic) ────────────────────────────

/**
 * An image query candidate carrying the LLM's semantic `motionFree` judgment.
 * Motion detection is delegated to the model (A1); the word-count and
 * query≠fallback guards remain deterministic.
 */
export interface ImageQueryCandidate {
  slot: number;
  query: string;
  fallback: string;
  /** LLM flag: true if the query describes a static scene (no motion/action). */
  motionFree?: boolean;
}

export interface ImageQueryViolation {
  slot: number;
  query: string;
  reason: "word-count" | "motion-verb" | "query-equals-fallback";
}

export function validateImageQueryStyle(queries: ImageQueryCandidate[]): ImageQueryViolation[] {
  const violations: ImageQueryViolation[] = [];

  for (const q of queries) {
    const wordCount = q.query.split(/\s+/).filter(Boolean).length;

    if (wordCount < 2 || wordCount > 4) {
      violations.push({ slot: q.slot, query: q.query, reason: "word-count" });
    }

    // Motion is judged semantically by the LLM (motionFree flag), not a regex.
    // Only an explicit `false` flags; an absent flag is not second-guessed.
    if (q.motionFree === false) {
      violations.push({ slot: q.slot, query: q.query, reason: "motion-verb" });
    }

    if (q.query === q.fallback) {
      violations.push({ slot: q.slot, query: q.query, reason: "query-equals-fallback" });
    }
  }

  return violations;
}

export function applyImageQueryFallbacks(
  queries: ImageQueryCandidate[],
  violations: ImageQueryViolation[],
  runName: string,
): ImageQuery[] {
  const replaceSlots = new Set<number>();
  for (const v of violations) {
    if (v.reason !== "query-equals-fallback") {
      replaceSlots.add(v.slot);
    }
  }

  const result = queries.map((q) => {
    if (!replaceSlots.has(q.slot)) return q;

    process.stderr.write(
      `[${runName}] slot ${q.slot}: query "${q.query}" violates — replacing with fallback "${q.fallback}"\n`
    );

    return { ...q, query: q.fallback };
  });

  // Re-validate fallback word count (safety net — prevent edge-case 1-token fallback)
  for (const q of result) {
    if (replaceSlots.has(q.slot)) {
      const wc = q.query.split(/\s+/).filter(Boolean).length;
      if (wc < 2) {
        console.warn(
          `[${runName}] slot ${q.slot}: fallback "${q.query}" has ${wc} word(s) — accepting anyway (no further replacement to avoid loop)`
        );
      }
    }
  }

  // Log query-equals-fallback warnings (no mutation)
  for (const v of violations) {
    if (v.reason === "query-equals-fallback") {
      process.stderr.write(
        `[${runName}] slot ${v.slot}: query equals fallback "${v.query}" — consider manual review\n`
      );
    }
  }

  return result;
}

export interface ShotContext {
  shotIndex: number;
  palette: "cool-tech" | "warm-real";
  sentenceText: string;
}

const PALETTE_FALLBACK_KEYWORD: Record<"cool-tech" | "warm-real", string> = {
  "cool-tech": "financial",
  "warm-real": "community",
};

const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "has", "been", "that", "this", "with",
  "from", "your", "have", "will", "they", "were", "when", "what", "their",
  "more", "than", "some", "into", "over", "each", "also", "very", "year",
  "rate", "just",
]);

// Stop list for the OFFLINE fallback query derivation. Drops finance-relevant
// tokens ("rate", "year") that are evocative for this niche's imagery, and adds
// connective/prepositional fillers that crowd out concrete nouns.
const QUERY_DERIVATION_STOPWORDS = (() => {
  const s = new Set(STOPWORDS);
  s.delete("rate");
  s.delete("year");
  for (const w of ["through", "while", "after", "before", "about", "between", "during", "across", "because", "though", "these", "those", "which"]) {
    s.add(w);
  }
  return s;
})();

const roleHints: Record<string, string> = {
  hook: "prefer striking, memorable imagery that grabs attention",
  baseline: "prefer institutional, system-level imagery — offices, trading floors, data centers, mechanism diagrams",
  escalation: "prefer escalating tension imagery — tightening graphs, magnifying glasses, systems under pressure",
  turn: "prefer contrast imagery — before/after, two sides of street, opposing views, dramatic reveals",
  payoff: "prefer forward-looking, aspirational imagery — modern offices, city skylines, people working, resolved tension",
  context: "prefer institutional, system-level imagery — offices, trading floors, data centers",
  data: "prefer charts, trading floors, data screens, financial terminals, spreadsheets — visual data representations",
  consequence: "prefer human-scale imagery — families, homes, streets, storefronts, communities affected",
  cta: "prefer forward-looking, aspirational imagery — modern offices, city skylines, people working",
  build: "prefer process-oriented, construction-like imagery — growth, development, scale",
};

function segmentSystemPrompt(plan: DocuSegmentPlan): string {
  const role = ("arcRole" in plan) ? (plan as { arcRole: string }).arcRole : plan.role ?? "context";
  const hint = roleHints[role] ?? `focus on imagery appropriate for a "${role}" scene`;
  return llmSegmentImageQueryPrompt({
    role,
    title: plan.title,
    intent: plan.intent,
    hint,
  });
}

/**
 * Offline fallback query derivation — runs ONLY when the LLM has already failed
 * all retries (catch path). Salience-ranks content words by length (a crude
 * noun proxy) and keeps the top 4 in reading order, so evocative nouns survive
 * instead of being lost to position-based top-3 truncation.
 */
export function deriveFallbackQuery(sentenceText: string, palette: "cool-tech" | "warm-real"): string {
  const words = sentenceText
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3); // drop short tokens (articles, short years like "2013")
  const contentWords = words.filter((w) => !QUERY_DERIVATION_STOPWORDS.has(w.toLowerCase()));
  const top = contentWords
    .map((w, i) => ({ w, i }))
    .sort((a, b) => b.w.length - a.w.length || a.i - b.i) // most salient (longest) first
    .slice(0, 4)
    .sort((a, b) => a.i - b.i) // restore reading order
    .map((x) => x.w)
    .join(" ");
  const paletteWord = PALETTE_FALLBACK_KEYWORD[palette];
  return top ? `${top} ${paletteWord}` : `${paletteWord} documentary`;
}

async function generateImageQueriesImpl(
  shots: ShotContext[],
  systemPrompt: string,
  runName: string,
  opts?: { verbose?: boolean },
): Promise<ImageQuery[]> {
  const ImageQueryOutputSchema = z.object({
    shots: z.array(z.object({
      shotIndex: z.number().int().min(0),
      query: z.string().min(1),
      fallback: z.string().min(1),
      motionFree: z.boolean(),
    })),
  }).refine(
    (d) => d.shots.length === shots.length,
    { message: `Expected ${shots.length} shots but got {actual}` },
  );

  const shotLines = shots.map((sh) =>
    `[shot ${sh.shotIndex}] palette="${sh.palette}" sentence: "${sh.sentenceText}"`
  ).join("\n");

  const userPrompt = `Shot count: ${shots.length}\n\n${shotLines}\n\nProduce exactly ${shots.length} image queries.`;

  try {
    const result = await callStructured({
      schema: ImageQueryOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
      runName,
      verbose: opts?.verbose,
      llm: LLM_IMAGE_QUERY,
    });

    const sorted: ImageQueryCandidate[] = result.shots
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((s) => ({ slot: s.shotIndex, query: s.query, fallback: s.fallback, motionFree: s.motionFree }));

    const violations = validateImageQueryStyle(sorted);
    return violations.length > 0
      ? applyImageQueryFallbacks(sorted, violations, runName)
      : sorted;
  } catch (err) {
    console.warn(
      `[${runName}] LLM call failed after retries (${err instanceof Error ? err.message : String(err)}); using palette-aware fallback queries`,
    );
    return shots.map((sh) => {
      const fb = deriveFallbackQuery(sh.sentenceText, sh.palette);
      return { slot: sh.shotIndex, query: fb, fallback: "documentary background" };
    });
  }
}

export async function generateSegmentImageQueries(
  plan: DocuSegmentPlan,
  shots: ShotContext[],
  opts?: { verbose?: boolean },
): Promise<ImageQuery[]> {
  return generateImageQueriesImpl(
    shots,
    segmentSystemPrompt(plan),
    `docu/image-queries/seg-${String(plan.index).padStart(2, "0")}`,
    opts,
  );
}
