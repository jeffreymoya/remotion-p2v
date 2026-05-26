import { z } from "zod";
import type { Anchor } from "../shared/research/research-schema";
import type { DataItem } from "./overlays/types";
import { DataItemSchema, OVERLAY_UNITS } from "./overlays/types";
import { callStructured } from "./llm-client";
import { LLM_METRIC } from "../config";
import { LLM_METRIC_EXTRACTION_PROMPT } from "../prompts";

const ExtractionOutputSchema = z.object({
  dataItems: z.array(DataItemSchema),
});

function buildExtractionPrompt(): string {
  return LLM_METRIC_EXTRACTION_PROMPT;
}

function anchorText(anchor: Anchor): string {
  const parts = [anchor.claim, anchor.detail];
  if (anchor.quote) parts.push(anchor.quote);
  return parts.join(" ").toLowerCase();
}

/** Strip commas from a number string so "250,000" and "250000" both match. */
function normalizeNumericText(text: string): string {
  return text.replace(/(\d),(\d)/g, "$1$2");
}

function valueInAnchorText(item: DataItem, text: string): boolean {
  // Normalize comma-formatted numbers in anchor text (e.g. "250,000" → "250000")
  const normalizedText = normalizeNumericText(text);

  if (item.kind === "scalar") {
    const valStr = String(item.value);
    const valInt = String(Math.trunc(item.value));
    const valPatterns = [
      new RegExp(`\\b${escapeRegex(valStr)}\\b`),
      new RegExp(`\\b${escapeRegex(valInt)}\\b`),
    ];
    if (item.unit === "%") {
      valPatterns.push(new RegExp(`\\b${escapeRegex(valStr)}[%]`));
      valPatterns.push(new RegExp(`\\b${escapeRegex(valStr)}\\s*percent`));
      // basis points — accept bp/bps in anchor text when unit is %
      valPatterns.push(new RegExp(`\\b${escapeRegex(valStr)}\\s*b(?:asis\\s+points?|ps?)`));
    }
    if (item.unit === "$") {
      valPatterns.push(new RegExp(`\\$${escapeRegex(valStr)}\\b`));
      valPatterns.push(new RegExp(`\\$${escapeRegex(valInt)}\\b`));
      valPatterns.push(new RegExp(`\\b${escapeRegex(valStr)}\\s*dollars`));
    }
    return valPatterns.some((re) => re.test(normalizedText));
  }

  const points = item.points as Array<{ x: string | number; y: number }>;
  if (points.length === 0) return false;

  const allYStr = points.map((p) => String(p.y));

  let matches = 0;
  for (const yStr of allYStr) {
    const yInt = String(Math.trunc(Number(yStr)));
    if (
      new RegExp(`\\b${escapeRegex(yStr)}\\b`).test(normalizedText) ||
      new RegExp(`\\b${escapeRegex(yInt)}\\b`).test(normalizedText)
    ) {
      matches++;
    }
  }
  if (matches === 0) return false;

  let labelFound = true;
  const labelLower = item.label.toLowerCase();
  if (labelLower.length > 0) {
    const labelWords = labelLower.split(/\s+/).filter((w) => w.length > 2);
    labelFound = labelWords.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`).test(normalizedText));
  }

  return matches >= Math.min(2, allYStr.length) || (matches >= 1 && labelFound);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verifyDataItems(dataItems: DataItem[], anchors: readonly Anchor[]): { valid: DataItem[]; rejected: string[] } {
  const anchorMap = new Map(anchors.map((a) => [a.id, a]));
  const valid: DataItem[] = [];
  const rejected: string[] = [];

  for (const item of dataItems) {
    const anchor = anchorMap.get(item.sourceAnchorId);
    if (!anchor) {
      rejected.push(`${item.id ?? "unknown"}: sourceAnchorId "${item.sourceAnchorId}" not found in anchors`);
      continue;
    }
    if (anchor.citation.url !== item.sourceUrl) {
      rejected.push(`${item.id ?? "unknown"}: sourceUrl "${item.sourceUrl}" does not match anchor citation "${anchor.citation.url}"`);
      continue;
    }
    if (anchor.status !== "verified") {
      rejected.push(`${item.id ?? "unknown"}: anchor "${item.sourceAnchorId}" is not verified (status: ${anchor.status})`);
      continue;
    }
    const text = anchorText(anchor);
    if (!valueInAnchorText(item, text)) {
      const valDesc = item.kind === "scalar"
        ? `${String(item.value)}${item.unit}`
        : (item.points as Array<{ x: string | number; y: number }>).map((p) => `${p.y}`).join(", ");
      rejected.push(`${item.id ?? "unknown"}: value(s) [${valDesc}] not found in anchor "${item.sourceAnchorId}" text`);
      continue;
    }
    valid.push(item);
  }

  return { valid, rejected };
}

function buildAnchorListing(anchors: readonly Anchor[]): string {
  return anchors.map((a) =>
    `[${a.id}] claim: ${a.claim}\n  detail: ${a.detail}\n  quote: ${a.quote ?? "(none)"}\n  citation: ${a.citation.url} (${a.citation.title})\n  year: ${a.attribution.year ?? "unknown"}\n  person: ${a.attribution.person ?? "unknown"}`
  ).join("\n\n");
}

function assignIds(items: Array<{ kind: string; sourceAnchorId: string; [key: string]: unknown }>): DataItem[] {
  const counter: Record<string, number> = {};
  return items.map((item) => {
    const kind = item.kind;
    counter[kind] = (counter[kind] ?? 0) + 1;
    const id = `${kind}-${String(counter[kind]).padStart(2, "0")}`;
    return { ...item, id } as unknown as DataItem;
  });
}

export async function extractDataItems(
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<DataItem[]> {
  const verified = anchors.filter((a) => a.status === "verified");
  if (verified.length === 0) {
    console.warn("[metric-extraction] No verified anchors available — skipping extraction");
    return [];
  }

  const anchorListing = buildAnchorListing(verified);

  const userPrompt = `Extract ALL numeric data items from the following verified research anchors. Produce at least one item per anchor that contains numbers, and zero items for purely textual anchors.

Verified anchors:
${anchorListing}

Extract data items now.`;

  const maxRetries = 2;
  let lastError: unknown;
  let accumulatedValid: DataItem[] = [];
  const rejectedPhrases = new Set<string>();

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const retryAddendum = rejectedPhrases.size > 0
        ? `\n\nPrevious attempt: the following items were rejected by the metric-fidelity gate: ${Array.from(rejectedPhrases).slice(0, 5).join("; ")}. Ensure every sourceAnchorId references an exact anchor id from the list and every sourceUrl is the anchor's citation URL.`
        : "";

      const result = await callStructured({
        schema: ExtractionOutputSchema,
        system: buildExtractionPrompt(),
        prompt: userPrompt + retryAddendum,
        runName: "docu/metric-extraction",
        verbose: opts?.verbose,
        llm: LLM_METRIC,
      });

      const withIds = assignIds(result.dataItems);
      const { valid, rejected } = verifyDataItems(withIds, verified);

      if (rejected.length > 0) {
        for (const r of rejected) {
          rejectedPhrases.add(r);
        }
        if (attempt <= maxRetries && valid.length < verified.length) {
          // Keep valid items across attempts; only retry if yield is low relative to anchors
          accumulatedValid = [...accumulatedValid, ...valid];
          const deduped = new Map(accumulatedValid.map((di) => [di.id, di]));
          accumulatedValid = Array.from(deduped.values());
          process.stderr.write(
            `[docu/metric-extraction] Metric-fidelity gate rejected ${rejected.length} items (${accumulatedValid.length} valid so far). Retrying...\n`,
          );
          continue;
        }
        console.warn(
          `[docu/metric-extraction] Dropping ${rejected.length} rejected items (${valid.length} valid)`,
        );
      }

      accumulatedValid = [...accumulatedValid, ...valid];
      // Deduplicate by id
      const deduped = new Map(accumulatedValid.map((di) => [di.id, di]));
      accumulatedValid = Array.from(deduped.values());

      if (accumulatedValid.length === 0 && attempt <= maxRetries) {
        process.stderr.write(
          `[docu/metric-extraction] No valid items yet. Retrying...\n`,
        );
        continue;
      }

      if (opts?.verbose) {
        console.log(`[docu/metric-extraction] Extracted ${accumulatedValid.length} data items from ${verified.length} anchors across ${attempt} attempt(s)`);
      }
      return accumulatedValid;
    } catch (err) {
      lastError = err;
      if (attempt <= maxRetries) {
        process.stderr.write(
          `[docu/metric-extraction] LLM call failed on attempt ${attempt}, retrying...\n`,
        );
      }
    }
  }

  if (accumulatedValid.length > 0) return accumulatedValid;
  throw lastError ?? new Error("[docu/metric-extraction] Failed to extract data items");
}
