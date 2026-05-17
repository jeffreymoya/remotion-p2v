import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { traceable } from "langsmith/traceable";
import {
  RESEARCH_TARGET_ANCHOR_COUNT,
  RESEARCH_MIN_ANCHOR_COUNT,
  RESEARCH_BRAINSTORM_OVERSAMPLE,
  RESEARCH_VERIFY_CONCURRENCY,
  RESEARCH_MAX_BRAINSTORM_ROUNDS,
  EXA_API_KEY,
} from "../../config";
import type { Anchor, RawCandidate, ResearchBundle } from "./research-schema";
import { ResearchBundleSchema } from "./research-schema";
import { brainstormCandidates } from "./research-brainstorm";
import { verifyAnchor } from "./anchor-verifier";
import type { VerifyResult } from "./anchor-verifier";
import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";
import { makeExaProvider } from "./exa-client";
import { planTopicalQueries } from "./topical-queries";
import { buildCorpus } from "./corpus-builder";
import type { ResearchCorpus } from "./corpus-schema";
import { ResearchCorpusSchema } from "./corpus-schema";
import { enrichCurrentRun } from "../../tracing";

// ── Search cache ────────────────────────────────────────────────────────

const CACHE_DIR = "prompts/inspire/.cache";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function cacheKey(query: string): string {
  return `exa-${crypto.createHash("sha256").update(query).digest("hex").slice(0, 16)}.json`;
}

function readSearchCache(query: string): SearchHit[] | null {
  const p = path.join(CACHE_DIR, cacheKey(query));
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    if (Date.now() - raw.cachedAt > CACHE_TTL_MS) {
      fs.unlinkSync(p);
      return null;
    }
    return raw.hits as SearchHit[];
  } catch {
    return null;
  }
}

function writeSearchCache(query: string, hits: SearchHit[]): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const p = path.join(CACHE_DIR, cacheKey(query));
  fs.writeFileSync(p, JSON.stringify({ cachedAt: Date.now(), hits }, null, 2));
}

function makeCachingProvider(inner: SearchProvider): SearchProvider {
  return {
    search: traceable(async function exaSearch(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      const cached = readSearchCache(query);
      if (cached) {
        enrichCurrentRun({ provider: "exa", cacheHit: true });
        return cached;
      }
      enrichCurrentRun({ provider: "exa", cacheHit: false });
      const hits = await inner.search(query, opts);
      writeSearchCache(query, hits);
      return hits;
    }, { name: "exa.search", run_type: "retriever" }),
    getContents: inner.getContents?.bind(inner),
  };
}

// ── Concurrency limiter ─────────────────────────────────────────────────

async function mapConcurrent<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

// ── Resolve provider ───────────────────────────────────────────────────

function resolveProvider(custom?: SearchProvider): SearchProvider {
  if (custom) return custom;
  if (!EXA_API_KEY) {
    throw new Error(
      "EXA_API_KEY is required for the research phase. Set it in .env or pass --skip-research.",
    );
  }
  return makeCachingProvider(makeExaProvider(EXA_API_KEY));
}

// ── Main pipeline ──────────────────────────────────────────────────────

async function runResearchPhaseImpl(
  topic: string,
  slug: string,
  segmentCount: number,
  opts?: { verbose?: boolean; provider?: SearchProvider },
): Promise<ResearchBundle> {
  enrichCurrentRun({ slug, topic, phase: "research" });
  const verbose = opts?.verbose ?? false;
  const provider = resolveProvider(opts?.provider);
  const targetCount = RESEARCH_TARGET_ANCHOR_COUNT;
  const brainstormTarget = Math.ceil(targetCount * RESEARCH_BRAINSTORM_OVERSAMPLE);

  // Phase A: topical corpus — broad literature scan before per-anchor verification
  let corpus = loadCachedCorpus(slug);
  if (!corpus) {
    console.log(`  [corpus] planning topical queries...`);
    const queries = await planTopicalQueries(topic, { verbose });
    console.log(
      `  [corpus] running ${queries.length} queries (lenses: ${queries.map((q) => q.lens).join(", ")})...`,
    );
    corpus = await buildCorpus(topic, slug, queries, provider, { verbose });
    saveCorpus(corpus);
  } else {
    console.log(
      `  [corpus] reusing cached: ${corpus.excerpts.length} excerpts across ${corpus.queries.length} queries`,
    );
  }

  const allVerified: Anchor[] = [];
  const allRejected: Array<{ candidate: string; reason: string }> = [];
  let totalCandidates = 0;

  for (let round = 1; round <= RESEARCH_MAX_BRAINSTORM_ROUNDS; round++) {
    if (round > 1 && allVerified.length >= RESEARCH_MIN_ANCHOR_COUNT) break;

    console.log(
      `  [research] round ${round}/${RESEARCH_MAX_BRAINSTORM_ROUNDS}: brainstorming ${brainstormTarget} candidates...`,
    );

    const candidates = await brainstormCandidates(topic, brainstormTarget, {
      verbose,
      priorRejections:
        round > 1
          ? allRejected.map((r) => r.candidate)
          : undefined,
      corpus,
    });

    totalCandidates += candidates.length;

    console.log(
      `  [research] verifying ${candidates.length} candidates (concurrency=${RESEARCH_VERIFY_CONCURRENCY})...`,
    );

    const results = await mapConcurrent(
      candidates,
      RESEARCH_VERIFY_CONCURRENCY,
      (c: RawCandidate) => verifyAnchor(c, provider, { verbose }),
    );

    for (let i = 0; i < results.length; i++) {
      const result: VerifyResult = results[i];
      if ("status" in result && result.status === "rejected" && !("citation" in result)) {
        allRejected.push({
          candidate: candidates[i].claim,
          reason: (result as { status: "rejected"; reason: string }).reason,
        });
      } else {
        const anchor = result as Anchor;
        // Only include "verified" anchors in the usable pool (not "needs_review")
        const withId: Anchor = {
          ...anchor,
          id: `anc-${String(allVerified.length + 1).padStart(3, "0")}`,
        };
        allVerified.push(withId);
      }
    }

    console.log(
      `  [research] round ${round}: ${allVerified.length} verified, ${allRejected.length} rejected`,
    );
  }

  if (allVerified.length === 0) {
    throw new Error(
      `Research phase produced 0 verified anchors for "${topic}" after ${RESEARCH_MAX_BRAINSTORM_ROUNDS} rounds. ` +
        `Cannot proceed with unsourced narration. Re-run with --verbose for diagnostics.`,
    );
  }

  if (allVerified.length < RESEARCH_MIN_ANCHOR_COUNT) {
    console.warn(
      `  [research] WARNING: only ${allVerified.length} verified anchors (target ${RESEARCH_MIN_ANCHOR_COUNT}). ` +
        `Some chapters will rely on the specificity-floor gate for grounding.`,
    );
  }

  const bundle: ResearchBundle = {
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    candidatesGenerated: totalCandidates,
    anchors: allVerified,
    rejected: allRejected,
  };

  return bundle;
}

export const runResearchPhase = traceable(runResearchPhaseImpl, {
  name: "runResearchPhase",
  run_type: "chain",
}) as typeof runResearchPhaseImpl;

// ── Cache load/save helpers ───────────────────────────────────────────

export function researchBundlePath(slug: string): string {
  return `prompts/inspire/${slug}-research.json`;
}

export function loadCachedResearchBundle(slug: string): ResearchBundle | null {
  const p = researchBundlePath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return ResearchBundleSchema.parse(raw);
  } catch {
    console.log(`  [research] cached bundle corrupt — will regenerate`);
    return null;
  }
}

export function saveResearchBundle(bundle: ResearchBundle): void {
  const p = researchBundlePath(bundle.slug);
  fs.mkdirSync("prompts/inspire", { recursive: true });
  fs.writeFileSync(p, JSON.stringify(bundle, null, 2));
  console.log(`  [research] saved: ${p} (${bundle.anchors.length} anchors)`);
}

// ── Corpus cache load/save helpers ────────────────────────────────────

export function researchCorpusPath(slug: string): string {
  return `prompts/inspire/${slug}-corpus.json`;
}

export function loadCachedCorpus(slug: string): ResearchCorpus | null {
  const p = researchCorpusPath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return ResearchCorpusSchema.parse(raw);
  } catch {
    console.log(`  [corpus] cached corpus corrupt — will regenerate`);
    return null;
  }
}

export function saveCorpus(corpus: ResearchCorpus): void {
  const p = researchCorpusPath(corpus.slug);
  fs.mkdirSync("prompts/inspire", { recursive: true });
  fs.writeFileSync(p, JSON.stringify(corpus, null, 2));
  console.log(
    `  [corpus] saved: ${p} (${corpus.excerpts.length} excerpts, ${corpus.queries.length} queries)`,
  );
}
