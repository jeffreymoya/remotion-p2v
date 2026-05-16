import { z } from "zod";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import type { Anchor, RawCandidate } from "./research-schema";
import type { SearchProvider, SearchHit } from "./search-provider";
import {
  TRUSTED_DOMAINS,
  trustCategoryForKind,
  isTrustedUrl,
} from "./trusted-domains";

// ── Verification judgment schema ──────────────────────────────────────────

const VerificationJudgmentSchema = z.object({
  matchedHitIndex: z.number().int().nullable(),
  verifierConfidence: z.enum(["high", "medium", "low"]),
  notes: z.string(),
});

type VerificationJudgment = z.infer<typeof VerificationJudgmentSchema>;

// ── Substring overlap check ────────────────────────────────────────────────

/**
 * Check if at least `minWords` consecutive words from `quote` appear in `text`.
 */
export function hasSubstringOverlap(
  quote: string,
  text: string,
  minWords: number,
): boolean {
  const normalize = (s: string): string[] =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const quoteWords = normalize(quote);
  const textWords = normalize(text);

  if (quoteWords.length < minWords || textWords.length < minWords) return false;

  const textJoined = textWords.join(" ");

  for (let i = 0; i <= quoteWords.length - minWords; i++) {
    const window = quoteWords.slice(i, i + minWords).join(" ");
    if (textJoined.includes(window)) return true;
  }

  return false;
}

// ── DOI / arXiv extraction ─────────────────────────────────────────────────

const DOI_ARXIV_PATTERN = /(10\.\d{4,9}\/\S+|arxiv\.org\/abs\/\S+)/i;

function hasDoi(hits: readonly SearchHit[]): boolean {
  for (const hit of hits) {
    if (DOI_ARXIV_PATTERN.test(hit.url)) return true;
    if (hit.text && DOI_ARXIV_PATTERN.test(hit.text)) return true;
    if (hit.snippet && DOI_ARXIV_PATTERN.test(hit.snippet)) return true;
  }
  return false;
}

// ── Exa search category mapping ─────────────────────────────────────────

function searchCategory(
  kind: string,
): "research paper" | "news" | undefined {
  switch (kind) {
    case "study":
    case "meta_analysis":
      return "research paper";
    case "case_study":
    case "historical_event":
      return "news";
    default:
      return undefined;
  }
}

// ── Main verifier ──────────────────────────────────────────────────────────

export type VerifyResult =
  | Anchor
  | { status: "rejected"; reason: string };

export async function verifyAnchor(
  candidate: RawCandidate,
  provider: SearchProvider,
  opts?: { verbose?: boolean },
): Promise<VerifyResult> {
  const category = trustCategoryForKind(candidate.kind);
  const domains = [...TRUSTED_DOMAINS[category]];

  // Search with trusted domains first
  const query = candidate.queryHint || candidate.claim;
  let hits: SearchHit[];

  try {
    hits = await provider.search(query, {
      numResults: 5,
      category: searchCategory(candidate.kind),
      includeDomains: domains.length > 0 ? domains : undefined,
      contents: {
        text: { maxCharacters: 5000 },
        highlights: { maxCharacters: 500 },
      },
    });
  } catch (err) {
    if (opts?.verbose) {
      process.stderr.write(
        `[verify] search failed for "${candidate.claim.slice(0, 60)}": ${err}\n`,
      );
    }
    return { status: "rejected", reason: `search-error: ${err}` };
  }

  // If no hits on trusted domains, try a broader search
  if (hits.length === 0) {
    try {
      hits = await provider.search(query, {
        numResults: 5,
        category: searchCategory(candidate.kind),
        contents: {
          text: { maxCharacters: 5000 },
          highlights: { maxCharacters: 500 },
        },
      });
    } catch {
      return { status: "rejected", reason: "no-results" };
    }
  }

  if (hits.length === 0) {
    return { status: "rejected", reason: "no-results" };
  }

  // Take top 3 hits for LLM judgment
  const topHits = hits.slice(0, 3);

  const hitsContext = topHits
    .map(
      (h, i) =>
        `Hit ${i}:\nURL: ${h.url}\nTitle: ${h.title}\nSnippet: ${h.snippet?.slice(0, 300) ?? ""}\nText excerpt: ${h.text?.slice(0, 1000) ?? "(none)"}`,
    )
    .join("\n\n");

  let judgment: VerificationJudgment;
  try {
    judgment = await deepseekChatJson(
      [
        {
          role: "system",
          content:
            "You are a fact-checking assistant. Given a candidate claim and web search results, determine which hit (if any) supports the claim. Return JSON.",
        },
        {
          role: "user",
          content: `Candidate claim: "${candidate.claim}"
${candidate.quote ? `Candidate quote: "${candidate.quote}"` : ""}
Attribution: ${JSON.stringify(candidate.attributionGuess)}

Search results:
${hitsContext}

Judge which hit (if any) supports this claim. Return:
{
  "matchedHitIndex": <0-based index of best matching hit, or null if none>,
  "verifierConfidence": "high" | "medium" | "low",
  "notes": "<brief explanation>"
}`,
        },
      ],
      VerificationJudgmentSchema,
      0.1,
      NARRATION_REASONING,
      { verbose: opts?.verbose },
    );
  } catch (err) {
    if (opts?.verbose) {
      process.stderr.write(
        `[verify] judgment failed for "${candidate.claim.slice(0, 60)}": ${err}\n`,
      );
    }
    return { status: "rejected", reason: `judgment-error: ${err}` };
  }

  if (judgment.matchedHitIndex === null) {
    return { status: "rejected", reason: `no-match: ${judgment.notes}` };
  }

  const matchedHit = topHits[judgment.matchedHitIndex];
  if (!matchedHit) {
    return { status: "rejected", reason: "invalid-hit-index" };
  }

  // Apply per-kind tier rules
  let confidence = judgment.verifierConfidence;
  const onTrustedDomain = isTrustedUrl(matchedHit.url, category);

  switch (candidate.kind) {
    case "primary_quote": {
      if (candidate.quote && matchedHit.text) {
        const overlap = hasSubstringOverlap(candidate.quote, matchedHit.text, 10);
        if (!overlap || !onTrustedDomain) {
          confidence = confidence === "high" ? "medium" : confidence;
        }
      } else if (!onTrustedDomain) {
        confidence = confidence === "high" ? "medium" : confidence;
      }
      break;
    }
    case "book_excerpt": {
      if (!onTrustedDomain) {
        confidence = confidence === "high" ? "medium" : confidence;
      }
      break;
    }
    case "study":
    case "meta_analysis": {
      if (!hasDoi(topHits)) {
        return { status: "rejected", reason: "no-doi-found" };
      }
      break;
    }
    // case_study, historical_event, named_person_anecdote — lower bar
  }

  const status: Anchor["status"] =
    confidence === "high"
      ? "verified"
      : confidence === "medium"
        ? "needs_review"
        : "needs_review";

  const anchor: Anchor = {
    id: "", // assigned by pipeline
    kind: candidate.kind,
    claim: candidate.claim,
    detail: candidate.detail ?? candidate.claim,
    attribution: {
      person: candidate.attributionGuess.person,
      work: candidate.attributionGuess.work,
      year: candidate.attributionGuess.year,
      publisher: candidate.attributionGuess.publisher,
    },
    quote: candidate.quote,
    citation: {
      url: matchedHit.url,
      title: matchedHit.title,
      accessedAt: new Date().toISOString(),
      verifierConfidence: confidence,
      verifierNotes: judgment.notes,
    },
    status,
  };

  return anchor;
}
