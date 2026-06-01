import { traceable } from "langsmith/traceable";
import type { SearchProvider, SearchOptions } from "./search-provider";
import { TRUSTED_DOMAINS } from "./trusted-domains";
import type { TopicalLens, TopicalQuery } from "./topical-queries";
import type { CorpusExcerpt, ResearchCorpus } from "./corpus-schema";
import { enrichCurrentRun } from "../../tracing";

const DEFAULT_PER_QUERY_RESULTS = 8;
const TEXT_EXCERPT_MAX_CHARS = 5000;
const HIGHLIGHTS_MAX_CHARS = 500;
const MIN_TEXT_EXCERPT_CHARS = 200;
const DEAD_PAGE_MARKERS = [
  /are you a robot/i,
  /please enable javascript/i,
  /access denied/i,
  /captcha/i,
  /cloudflare/i,
  /sorry, you have been blocked/i,
  /please verify you are a human/i,
  /enable cookies/i,
  /403 forbidden/i,
  /this page isn't working/i,
  /subscription required/i,
  /subscribe to continue/i,
  /paywall/i,
  /please log in/i,
  /sign in to continue/i,
];

function exaCategory(lens: TopicalLens): SearchOptions["category"] {
  switch (lens) {
    case "meta_analysis":
    case "review_article":
    case "primary_study":
    case "critique_or_replication_failure":
      return "research paper";
    case "canonical_book":
      return "pdf";
    default:
      return undefined;
  }
}

function trustScope(lens: TopicalLens): string[] | undefined {
  switch (lens) {
    case "meta_analysis":
    case "review_article":
    case "primary_study":
    case "critique_or_replication_failure":
      return [...TRUSTED_DOMAINS.papers];
    case "canonical_book":
      return [...TRUSTED_DOMAINS.books];
    case "historical_context":
    case "statistics_or_distribution":
      return [...TRUSTED_DOMAINS.journalism, ...TRUSTED_DOMAINS.encyclopedia];
    case "definition_or_mechanism":
      return [...TRUSTED_DOMAINS.encyclopedia];
    default:
      return undefined;
  }
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function buildCorpusImpl(
  topic: string,
  slug: string,
  queries: readonly TopicalQuery[],
  provider: SearchProvider,
  opts?: { verbose?: boolean; perQueryResults?: number },
): Promise<ResearchCorpus> {
  enrichCurrentRun({ slug, topic, phase: "research" });
  const perQuery = opts?.perQueryResults ?? DEFAULT_PER_QUERY_RESULTS;
  const excerpts: CorpusExcerpt[] = [];
  const seenUrls = new Set<string>();

  for (const tq of queries) {
    const includeDomains = trustScope(tq.lens);
    let hits;
    try {
      hits = await provider.search(tq.query, {
        numResults: perQuery,
        category: exaCategory(tq.lens),
        includeDomains,
        contents: {
          text: { maxCharacters: TEXT_EXCERPT_MAX_CHARS },
          highlights: { maxCharacters: HIGHLIGHTS_MAX_CHARS },
        },
        lens: tq.lens,
      });
    } catch (err) {
      if (opts?.verbose) {
        process.stderr.write(
          `[corpus] query failed: ${tq.query} — ${err}\n`,
        );
      }
      continue;
    }

    for (const h of hits) {
      if (seenUrls.has(h.url)) continue;

      // Skip dead entries: paywalled, bot-detection, or empty pages
      const combinedText = (h.text ?? "") + (h.snippet ?? "");
      if (combinedText.length < MIN_TEXT_EXCERPT_CHARS) {
        if (opts?.verbose) {
          process.stderr.write(`[corpus] skipping "${h.title.slice(0, 60)}" — too little text (${combinedText.length} chars)\n`);
        }
        continue;
      }
      if (DEAD_PAGE_MARKERS.some((re) => re.test(combinedText))) {
        if (opts?.verbose) {
          const marker = DEAD_PAGE_MARKERS.find((re) => re.test(combinedText));
          process.stderr.write(`[corpus] skipping "${h.title.slice(0, 60)}" — dead page (match: ${marker?.source.slice(1, 30)})\n`);
        }
        continue;
      }

      seenUrls.add(h.url);
      excerpts.push({
        id: `exc-${String(excerpts.length + 1).padStart(3, "0")}`,
        lens: tq.lens,
        query: tq.query,
        url: h.url,
        domain: domainOf(h.url),
        title: h.title,
        highlights: h.highlights ?? [],
        textExcerpt: (h.text ?? "").slice(0, TEXT_EXCERPT_MAX_CHARS),
        score: h.score,
        fetchedAt: new Date().toISOString(),
      });
    }

    if (opts?.verbose) {
      process.stderr.write(
        `[corpus] ${tq.lens}: "${tq.query}" → ${hits.length} hits\n`,
      );
    }
  }

  return {
    topic,
    slug,
    generatedAt: new Date().toISOString(),
    queries: [...queries],
    excerpts,
  };
}

export const buildCorpus = traceable(buildCorpusImpl, {
  name: "buildCorpus",
  run_type: "chain",
}) as typeof buildCorpusImpl;
