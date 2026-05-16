import type { GateNote } from "../gates/gate-types";
import type { CrossChapterGateResult } from "./proofread-types";
import type { Anchor, ResearchBundle } from "../research/research-schema";
import { stringSimilarity } from "./string-similarity";

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Deterministic gate: verifies that every quoted span or attribution phrase
 * in the chapters matches an anchor in the research bundle.
 */
export function runCitationFidelityGate(
  chapters: readonly string[],
  research: ResearchBundle,
): CrossChapterGateResult[] {
  return chapters.map((chapter, idx) =>
    checkChapter(chapter, idx, research.anchors),
  );
}

function checkChapter(
  chapter: string,
  chapterIndex: number,
  anchors: readonly Anchor[],
): CrossChapterGateResult {
  const notes: GateNote[] = [];

  // Extract quoted spans
  const quotedSpans = extractQuotedSpans(chapter);
  // Extract attribution phrases
  const attributions = extractAttributions(chapter);

  for (const span of quotedSpans) {
    const match = findClosestAnchor(span, anchors);
    if (!match) {
      notes.push({
        gate: "citation-fidelity",
        severity: "block",
        evidence: span.length > 80 ? `${span.slice(0, 80)}...` : span,
        message: `Chapter ${chapterIndex + 1} cites unverified content — no matching anchor found`,
        suggestion: "Remove the quote or add a verified anchor to the research bundle",
      });
      continue;
    }

    // Verify quote accuracy if anchor has a quote field
    if (match.quote) {
      const quoteRatio = stringSimilarity(span, match.quote);
      if (quoteRatio < SIMILARITY_THRESHOLD) {
        notes.push({
          gate: "citation-fidelity",
          severity: "block",
          evidence: `"${span.slice(0, 60)}..." vs anchor quote: "${match.quote.slice(0, 60)}..."`,
          message: `Chapter ${chapterIndex + 1} misquotes anchor [${match.id}] (similarity: ${(quoteRatio * 100).toFixed(0)}%)`,
          suggestion: `Use the exact anchor quote or paraphrase without quotation marks`,
        });
      }
    }
  }

  for (const attr of attributions) {
    const match = findClosestAnchorByAttribution(attr, anchors);
    if (!match) continue; // Unmatched attributions are not necessarily errors

    // Verify person matches
    if (match.attribution.person && attr.person) {
      const personRatio = stringSimilarity(attr.person, match.attribution.person);
      if (personRatio < SIMILARITY_THRESHOLD) {
        notes.push({
          gate: "citation-fidelity",
          severity: "block",
          evidence: `Chapter says "${attr.person}" but anchor [${match.id}] says "${match.attribution.person}"`,
          message: `Chapter ${chapterIndex + 1} has attribution drift for person name`,
          suggestion: `Use "${match.attribution.person}" consistently`,
        });
      }
    }

    // Verify year matches
    if (match.attribution.year && attr.year) {
      if (Math.abs(attr.year - match.attribution.year) > 0) {
        notes.push({
          gate: "citation-fidelity",
          severity: "block",
          evidence: `Chapter says "${attr.year}" but anchor [${match.id}] says "${match.attribution.year}"`,
          message: `Chapter ${chapterIndex + 1} has year drift`,
          suggestion: `Use year ${match.attribution.year} consistently`,
        });
      }
    }
  }

  return {
    gate: "citation-fidelity",
    pass: notes.length === 0,
    notes,
  };
}

// ── Extraction helpers ──────────────────────────────────────────────────

interface AttributionPhrase {
  person?: string;
  year?: number;
  work?: string;
  raw: string;
}

function extractQuotedSpans(text: string): string[] {
  const matches: string[] = [];
  // Match text between straight double quotes or curly quotes
  const regex = /["\u201C]([^"\u201D]{10,})["\u201D]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

function extractAttributions(text: string): AttributionPhrase[] {
  const results: AttributionPhrase[] = [];

  // Pattern 1: "in/by/wrote/said/published Name..."
  const triggerRegex = /(?:in|by|wrote|said|published|according to)\s+([A-Z][^,.]{2,40})/g;
  let m: RegExpExecArray | null;
  while ((m = triggerRegex.exec(text)) !== null) {
    const raw = m[1].trim();
    const yearMatch = raw.match(/(\d{4})/);
    results.push({
      person: raw.replace(/\d{4}/, "").replace(/['"]/g, "").trim() || undefined,
      year: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
      raw,
    });
  }

  // Pattern 2: "In YYYY, Name verb" — captures year+name associations
  const yearNameRegex = /[Ii]n\s+(\d{4})\s*,?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:published|wrote|demonstrated|showed|found|argued|reported)/g;
  while ((m = yearNameRegex.exec(text)) !== null) {
    results.push({
      person: m[2].trim(),
      year: parseInt(m[1], 10),
      raw: m[0],
    });
  }

  // Pattern 3: "Name ... in/from YYYY" within a short span
  const nameYearRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:published|wrote|demonstrated|showed|found|argued|reported)[^.]{0,60}(?:in|from)\s+(\d{4})/g;
  while ((m = nameYearRegex.exec(text)) !== null) {
    const person = m[1].trim();
    const year = parseInt(m[2], 10);
    // Avoid duplicates
    if (!results.some((r) => r.person === person && r.year === year)) {
      results.push({ person, year, raw: m[0] });
    }
  }

  // Pattern 4: "a PLACE study from the YYYYs/YYYY" (e.g. "a Harvard study from the early 2000s")
  const studyRegex = /(?:a|the|A|The)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:study|paper|research|report)\s+(?:from|in)\s+(?:the\s+(?:early|mid|late)\s+)?(\d{4})s?/g;
  while ((m = studyRegex.exec(text)) !== null) {
    results.push({
      person: m[1].trim(),
      year: parseInt(m[2], 10),
      raw: m[0],
    });
  }

  // Pattern 5: "wrote/written that in YYYY" or "He'd written that in YYYY"
  // Look back across sentence boundaries to find the attributed person
  const wroteInRegex = /(?:wrote|written)\s+that\s+in\s+(\d{4})/g;
  while ((m = wroteInRegex.exec(text)) !== null) {
    // Look back ~200 chars for a proper name
    const lookbackStart = Math.max(0, m.index - 200);
    const segment = text.slice(lookbackStart, m.index);
    // Find the last proper name (two+ capitalized words) in the lookback
    const names = [...segment.matchAll(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g)];
    const nameMatch = names.length > 0 ? names[names.length - 1] : null;
    if (nameMatch) {
      results.push({
        person: nameMatch[1].trim(),
        year: parseInt(m[1], 10),
        raw: m[0],
      });
    }
  }

  return results;
}

// ── Matching helpers ────────────────────────────────────────────────────

function findClosestAnchor(
  quotedSpan: string,
  anchors: readonly Anchor[],
): Anchor | null {
  let best: Anchor | null = null;
  let bestScore = 0;

  for (const anchor of anchors) {
    if (!anchor.quote) continue;
    const score = stringSimilarity(quotedSpan, anchor.quote);
    if (score > bestScore) {
      bestScore = score;
      best = anchor;
    }
  }

  // Also check claim/detail fields for paraphrases
  if (bestScore < SIMILARITY_THRESHOLD) {
    for (const anchor of anchors) {
      const claimScore = stringSimilarity(quotedSpan, anchor.claim);
      if (claimScore > bestScore) {
        bestScore = claimScore;
        best = anchor;
      }
      if (anchor.detail) {
        const detailScore = stringSimilarity(quotedSpan, anchor.detail);
        if (detailScore > bestScore) {
          bestScore = detailScore;
          best = anchor;
        }
      }
    }
  }

  return bestScore >= SIMILARITY_THRESHOLD ? best : null;
}

function findClosestAnchorByAttribution(
  attr: AttributionPhrase,
  anchors: readonly Anchor[],
): Anchor | null {
  if (!attr.person) return null;

  for (const anchor of anchors) {
    if (!anchor.attribution.person) continue;
    const personRatio = stringSimilarity(attr.person, anchor.attribution.person);
    if (personRatio >= 0.7) return anchor; // Lower threshold for person name matching
  }
  return null;
}
