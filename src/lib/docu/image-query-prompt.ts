import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_IMAGE_QUERY } from "../config";
import { llmSegmentImageQueryPrompt } from "../prompts";
import type { ImageQuery } from "./image-pipeline";
import type { DocuSegmentPlan } from "./segment-types";

// ── Image-query style gate (deterministic) ────────────────────────────

export const MOTION_VERB_RE =
  /\b(running|walking|flying|jumping|moving|spinning|rotating|dancing|driving|swimming|climbing|rushing|streaming|flowing)\b/i;

export interface ImageQueryViolation {
  slot: number;
  query: string;
  reason: "word-count" | "motion-verb" | "query-equals-fallback";
}

export function validateImageQueryStyle(queries: ImageQuery[]): ImageQueryViolation[] {
  const violations: ImageQueryViolation[] = [];

  for (const q of queries) {
    const wordCount = q.query.split(/\s+/).filter(Boolean).length;

    if (wordCount < 2 || wordCount > 4) {
      violations.push({ slot: q.slot, query: q.query, reason: "word-count" });
    }

    if (MOTION_VERB_RE.test(q.query)) {
      violations.push({ slot: q.slot, query: q.query, reason: "motion-verb" });
    }

    if (q.query === q.fallback) {
      violations.push({ slot: q.slot, query: q.query, reason: "query-equals-fallback" });
    }
  }

  return violations;
}

export function applyImageQueryFallbacks(
  queries: ImageQuery[],
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

function deriveFallbackQuery(sentenceText: string, palette: "cool-tech" | "warm-real"): string {
  const words = sentenceText
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3); // stricter: drop short tokens like years ("2013")
  const contentWords = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const top = contentWords.slice(0, 3).join(" ");
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

    const sorted: ImageQuery[] = result.shots
      .sort((a, b) => a.shotIndex - b.shotIndex)
      .map((s) => ({ slot: s.shotIndex, query: s.query, fallback: s.fallback }));

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
