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
  SERPER_API_KEY,
} from "../../config";
import type { Anchor, RawCandidate, ResearchBundle } from "./research-schema";
import { ResearchBundleSchema } from "./research-schema";
import { brainstormCandidates } from "./research-brainstorm";
import { verifyAnchor } from "./anchor-verifier";
import type { VerifyResult } from "./anchor-verifier";
import type { SearchProvider, SearchHit, SearchOptions } from "./search-provider";
import { makeExaProvider } from "./exa-client";
import { makeSerperProvider } from "./serper-client";
import { makeRoutedProvider } from "./routed-provider";
import { planTopicalQueries } from "./topical-queries";
import { buildCorpus } from "./corpus-builder";
import type { ResearchCorpus } from "./corpus-schema";
import { ResearchCorpusSchema } from "./corpus-schema";
import { enrichCurrentRun } from "../../tracing";

// ── Search cache ────────────────────────────────────────────────────────

const CACHE_DIR = "prompts/inspire/.cache";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function searchCacheKey(prefix: string, query: string, opts?: SearchOptions): string {
  const key = JSON.stringify({
    query,
    domains: opts?.includeDomains?.slice().sort(),
    category: opts?.category,
  });
  return `${prefix}-${crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)}.json`;
}

function readCache<T>(file: string): T | null {
  const p = path.join(CACHE_DIR, file);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    if (Date.now() - raw.cachedAt > CACHE_TTL_MS) {
      fs.unlinkSync(p);
      return null;
    }
    return raw.value as T;
  } catch {
    return null;
  }
}

function writeCache(file: string, value: unknown): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const p = path.join(CACHE_DIR, file);
  fs.writeFileSync(p, JSON.stringify({ cachedAt: Date.now(), value }, null, 2));
}

type CachingProviderPrefix = "exa" | "serper";

function makeCachingProvider(inner: SearchProvider, prefix: CachingProviderPrefix): SearchProvider {
  return {
    search: traceable(async function cachedSearch(query: string, opts?: SearchOptions): Promise<SearchHit[]> {
      const file = searchCacheKey(prefix, query, opts);
      const cached = readCache<SearchHit[]>(file);
      if (cached) {
        enrichCurrentRun({ provider: prefix, cacheHit: true });
        return cached;
      }
      enrichCurrentRun({ provider: prefix, cacheHit: false });
      const hits = await inner.search(query, opts);
      writeCache(file, hits);
      return hits;
    }, { name: `${prefix}.search`, run_type: "retriever" }),
    getContents: inner.getContents?.bind(inner),
  };
}

// ── Verification cache ──────────────────────────────────────────────────

function verifyCacheKey(candidate: RawCandidate): string {
  const key = `${candidate.kind}|${candidate.claim}|${candidate.quote ?? ""}`;
  return `verify-${crypto.createHash("sha256").update(key).digest("hex").slice(0, 16)}.json`;
}

function readVerifyCache(candidate: RawCandidate): VerifyResult | null {
  return readCache<VerifyResult>(verifyCacheKey(candidate));
}

function writeVerifyCache(candidate: RawCandidate, result: VerifyResult): void {
  writeCache(verifyCacheKey(candidate), result);
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
  const exa = makeCachingProvider(makeExaProvider(EXA_API_KEY), "exa");
  if (!SERPER_API_KEY) return exa;
  const serper = makeCachingProvider(makeSerperProvider(SERPER_API_KEY), "serper");
  return makeRoutedProvider(exa, serper);
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
      async (c: RawCandidate): Promise<VerifyResult> => {
        const cached = readVerifyCache(c);
        if (cached) return cached;
        const result = await verifyAnchor(c, provider, { verbose });
        writeVerifyCache(c, result);
        return result;
      },
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
