import { z } from "zod";
import { traceableChain, textOnlyAssetSummary } from "../tracing";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { OverlaySpec, OverlayDef } from "./overlays/registry";
import {
  OVERLAY_REGISTRY,
  PROMPTABLE_REGISTRY,
  type SelectionInput,
} from "./overlays/registry";
import type { DataItem, DataItemKind } from "./overlays/types";
import { normalizeToken } from "./overlays/anchor-strategies";
import { callStructured } from "./llm-client";
import { LLM_OVERLAY, LLM_JUDGE } from "../config";
import { llmSegmentOverlaySelectionPrompt } from "../prompts";
import type { DocuSegmentPlan } from "./segment-types";
import type { DocuPalette } from "../../components/docu/docu-tokens";
import { extractMagnitudes, valueMatchesText } from "../shared/numeric-normalize";

// ── Typed selection schema ────────────────────────────────────────────

const NumericSelectionSchema = z.object({
  type: z.string().min(1),
  dataItemId: z.string().min(1),
  anchorPhrase: z.string().min(1),
  holdSec: z.number().positive(),
  leadSec: z.number().optional(),
  palette: z.enum(["cool-tech", "warm-real"]),
  text: z.string().optional(),
  source: z.string().optional(),
});

const TextualSelectionSchema = z.object({
  type: z.string().min(1),
  anchorPhrase: z.string().min(1),
  holdSec: z.number().positive(),
  leadSec: z.number().optional(),
  palette: z.enum(["cool-tech", "warm-real"]),
  text: z.string().min(1),
  source: z.string().optional(),
  sourceAnchorId: z.string(),
});

const AnySelectionSchema = z.union([NumericSelectionSchema, TextualSelectionSchema]);

const SelectionOutputSchema = z.object({
  selections: z.array(AnySelectionSchema),
});

type AnySelection = z.infer<typeof AnySelectionSchema>;

// ── Menu builders ─────────────────────────────────────────────────────

function buildPromtableMenu(): string {
  const byCategory: Record<string, Array<{ type: string; rule: string; consumes: string }>> = {};
  for (const [type, def] of Object.entries(PROMPTABLE_REGISTRY)) {
    const cat = def.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({
      type,
      rule: def.promptRule,
      consumes: def.consumes,
    });
  }

  let menu = "";
  for (const [cat, entries] of Object.entries(byCategory)) {
    menu += `\n### ${cat}\n`;
    for (const e of entries) {
      menu += `- ${e.type}: ${e.rule} (consumes: ${e.consumes})\n`;
    }
  }
  return menu;
}

function buildDataItemListing(dataItems: DataItem[]): string {
  if (dataItems.length === 0) return "(no data items extracted from research)";

  const byKind: Record<string, DataItem[]> = {};
  for (const di of dataItems) {
    if (!byKind[di.kind]) byKind[di.kind] = [];
    byKind[di.kind].push(di);
  }

  let listing = "";
  for (const [kind, items] of Object.entries(byKind)) {
    listing += `\n### ${kind}\n`;
    for (const item of items) {
      if (item.kind === "scalar") {
        listing += `- [${item.id}] ${item.label}: ${item.value}${item.unit} (source: ${item.sourceUrl})\n`;
      } else {
        const pointsStr = (item as { points: Array<{ x: string | number; y: number }> }).points
          .map((p) => `${String(p.x)}: ${p.y}${item.unit}`)
          .join(", ");
        listing += `- [${item.id}] ${item.label}: ${pointsStr} (source: ${item.sourceUrl})\n`;
      }
    }
  }
  return listing;
}

function segmentSelectionSystemPrompt(plan: DocuSegmentPlan, hasDataItems: boolean): string {
  const role = ("arcRole" in plan) ? (plan as { arcRole: string }).arcRole : plan.role ?? "context";
  return llmSegmentOverlaySelectionPrompt({
    role,
    title: plan.title,
    intent: plan.intent,
    menu: buildPromtableMenu(),
    hasDataItems,
  });
}

// ── Shared helpers ────────────────────────────────────────────────────

function buildSentenceList(sentences: SentenceDef[]): string {
  return sentences.map((s, i) => `[sent-${i + 1}] "${s.text}"`).join("\n");
}

function validateAnchorPhrases(
  selections: Array<{ anchorPhrase: string }>,
  sentences: SentenceDef[],
): string[] {
  const corpus = sentences.map((s) =>
    s.text.split(/\s+/).map(normalizeToken).filter(Boolean),
  );

  const invalid: string[] = [];

  for (const sel of selections) {
    const phraseTokens = sel.anchorPhrase
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean);

    if (phraseTokens.length === 0) {
      invalid.push(sel.anchorPhrase);
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
      invalid.push(sel.anchorPhrase);
    }
  }

  return invalid;
}

// ── Population: selections → OverlaySpec[] ────────────────────────────

function hasDataItemId(sel: AnySelection): sel is z.infer<typeof NumericSelectionSchema> {
  return "dataItemId" in sel && typeof (sel as { dataItemId?: unknown }).dataItemId === "string";
}

function populateSelections(
  selections: AnySelection[],
  dataItems: DataItem[],
): OverlaySpec[] {
  const dataItemMap = new Map(dataItems.map((di) => [di.id, di]));
  const specs: OverlaySpec[] = [];

  for (const sel of selections) {
    const def = OVERLAY_REGISTRY[sel.type as keyof typeof OVERLAY_REGISTRY];
    if (!def) {
      console.warn(`[overlay-selection] Unknown overlay type "${sel.type}" — skipping`);
      continue;
    }

    let raw: Record<string, unknown>;

    if (def.consumes !== "anchor" && hasDataItemId(sel)) {
      // Numeric overlay: populate from DataItem
      const dataItem = dataItemMap.get(sel.dataItemId);
      if (!dataItem) {
        console.warn(`[overlay-selection] DataItem "${sel.dataItemId}" not found — skipping`);
        continue;
      }
      const acceptedKinds = (def as OverlayDef).consumesKinds ?? [def.consumes as DataItemKind];
      if (!(acceptedKinds as ReadonlyArray<string>).includes(dataItem.kind)) {
        console.warn(
          `[overlay-selection] DataItem "${sel.dataItemId}" kind "${dataItem.kind}" not accepted by "${sel.type}" (accepts: ${acceptedKinds.join(", ")}) — skipping`,
        );
        continue;
      }

      if (def.populate) {
        raw = def.populate(dataItem, sel as unknown as SelectionInput);
      } else {
        console.warn(`[overlay-selection] No populate fn for numeric type "${sel.type}" — skipping`);
        continue;
      }
    } else if (def.consumes !== "anchor" && !hasDataItemId(sel)) {
      console.warn(`[overlay-selection] Numeric overlay "${sel.type}" missing dataItemId — skipping`);
      continue;
    } else if (def.consumes === "anchor") {
      // Textual overlay: pass through directly
      const { type: _t, anchorPhrase: _ap, holdSec: _hs, palette: _pa, ...extra } = sel as TextualSelection;
      raw = {
        type: sel.type,
        anchorPhrase: sel.anchorPhrase,
        holdSec: sel.holdSec,
        palette: sel.palette,
        ...extra,
      };
    } else {
      continue;
    }

    // Validate populated spec against the overlay def's schema
    const parsed = def.schema.safeParse(raw);
    if (!parsed.success) {
      console.warn(
        `[overlay-selection] Populated spec failed schema validation for "${sel.type}": ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")} — skipping`,
      );
      continue;
    }
    specs.push(parsed.data as OverlaySpec);
  }

  return specs;
}

type TextualSelection = z.infer<typeof TextualSelectionSchema>;

// ── Number-agreement gate ─────────────────────────────────────────────

function findSentenceIndex(
  anchorPhrase: string,
  sentences: SentenceDef[],
): number | null {
  const phraseTokens = anchorPhrase
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  if (phraseTokens.length === 0) return null;

  for (let si = 0; si < sentences.length; si++) {
    const sentTokens = sentences[si].text
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean);

    for (let i = 0; i <= sentTokens.length - phraseTokens.length; i++) {
      let match = true;
      for (let j = 0; j < phraseTokens.length; j++) {
        if (sentTokens[i + j] !== phraseTokens[j]) {
          match = false;
          break;
        }
      }
      if (match) return si;
    }
  }

  return null;
}

interface NumberAgreementViolation {
  index: number;
  anchorPhrase: string;
  dataItemId: string;
  value: number;
  unit: string;
  sentence: string;
}

export function validateNumberAgreement(
  selections: AnySelection[],
  sentences: SentenceDef[],
  dataItems: DataItem[],
): NumberAgreementViolation[] {
  const dataItemMap = new Map(dataItems.map((di) => [di.id, di]));
  const violations: NumberAgreementViolation[] = [];

  for (let i = 0; i < selections.length; i++) {
    const sel = selections[i];
    // Only check numeric selections (those with dataItemId)
    if (!("dataItemId" in sel)) continue;

    const dataItemId = (sel as { dataItemId?: string }).dataItemId;
    if (!dataItemId) continue;

    const dataItem = dataItemMap.get(dataItemId);
    if (!dataItem) continue; // will be caught by populateSelections

    const sentIdx = findSentenceIndex(sel.anchorPhrase, sentences);
    if (sentIdx === null) continue; // will be caught by validateAnchorPhrases

    const sentenceText = sentences[sentIdx].text;

    // Check if the sentence states ANY numeric magnitude — digits OR spelled-out
    // numbers (e.g. "nine point one percent"). A bare `/\d/` test would skip the
    // spelled-out case and miss a real placement mismatch.
    if (extractMagnitudes(sentenceText).length === 0) continue; // overlay legitimately amplifies data narration doesn't state

    // For scalar DataItems, check value agreement
    if (dataItem.kind === "scalar") {
      if (!valueMatchesText(dataItem.value, dataItem.unit, sentenceText)) {
        violations.push({
          index: i,
          anchorPhrase: sel.anchorPhrase,
          dataItemId,
          value: dataItem.value,
          unit: dataItem.unit,
          sentence: sentenceText,
        });
      }
    }
    // Multi-point items: too complex to verify mechanically; skip
  }

  return violations;
}

// ── Deterministic overlay placement validation ──────────────────────

export interface OverlayPlacementIssue {
  specIndex: number;
  kind: "palette-drift" | "anchor-collision";
  detail: string;
}

export interface OverlayPlacementWarning {
  kind: "density-low" | "density-high";
  ratio: number;
  detail: string;
}

export function validateOverlayPlacement(
  specs: OverlaySpec[],
  sentences: SentenceDef[],
): { issues: OverlayPlacementIssue[]; warnings: OverlayPlacementWarning[] } {
  const issues: OverlayPlacementIssue[] = [];
  const warnings: OverlayPlacementWarning[] = [];

  const ratio = sentences.length > 0 ? specs.length / sentences.length : 0;
  if (ratio < 0.2) {
    warnings.push({
      kind: "density-low",
      ratio,
      detail: `Overlay density low: ${specs.length} overlays / ${sentences.length} sentences = ${(ratio * 100).toFixed(1)}% (target: 20-50%)`,
    });
  } else if (ratio > 0.5) {
    warnings.push({
      kind: "density-high",
      ratio,
      detail: `Overlay density high: ${specs.length} overlays / ${sentences.length} sentences = ${(ratio * 100).toFixed(1)}% (target: 20-50%)`,
    });
  }

  const phraseMap = new Map<string, number>();
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const phraseKey = spec.anchorPhrase
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean)
      .join(" ");

    const sentIdx = findSentenceIndex(spec.anchorPhrase, sentences);
    if (sentIdx !== null) {
      const sentencePalette = sentences[sentIdx].palette;
      if (spec.palette !== sentencePalette) {
        issues.push({
          specIndex: i,
          kind: "palette-drift",
          detail: `Overlay[${i}] palette "${spec.palette}" differs from sentence[${sentIdx}] palette "${sentencePalette}"`,
        });
      }
    }

    if (phraseKey) {
      const existing = phraseMap.get(phraseKey);
      if (existing !== undefined) {
        issues.push({
          specIndex: i,
          kind: "anchor-collision",
          detail: `Overlay[${i}] anchorPhrase "${spec.anchorPhrase}" already used by Overlay[${existing}]`,
        });
      } else {
        phraseMap.set(phraseKey, i);
      }
    }
  }

  return { issues, warnings };
}

// ── Semantic overlay placement judge (LLM) ───────────────────────────

const MAX_OVERLAY_JUDGE_RETRIES = 1;

const OverlayJudgeResponseSchema = z.object({
  verdicts: z.array(z.object({
    specIndex: z.number().int().min(0),
    keep: z.boolean(),
    reason: z.string().optional(),
  })),
});

function buildOverlayJudgeSystemPrompt(): string {
  return `You are reviewing overlay selections for a Bloomberg-style documentary.
For each overlay, determine if it amplifies the MOST SALIENT fact in its anchored sentence
— not a supporting detail, not a figure mentioned in passing.

Rules:
1. A kinetic-number/chart overlay should display the central statistic the sentence is ABOUT.
   If the value appears in the sentence but is a subordinate clause or aside, mark keep=false.
2. A headline-card overlay should anchor to the sentence's primary claim, not a parenthetical.
3. If the sentence has no clear salient fact (pure transition, hook), mark keep=false.
4. When in doubt, keep=true.

Return JSON only, no markdown fences.`;
}

export async function gateOverlayPlacement(
  specs: OverlaySpec[],
  sentences: SentenceDef[],
  issues: OverlayPlacementIssue[],
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  if (specs.length === 0) return specs;

  let current = specs;
  let previousDropCount = 0;

  for (let attempt = 1; attempt <= MAX_OVERLAY_JUDGE_RETRIES + 1; attempt++) {
    const sentenceList = sentences
      .map((s, i) => `[sent-${i + 1}] "${s.text}" (palette: ${s.palette})`)
      .join("\n");

    const specList = current
      .map((s, i) => `[spec-${i}] type=${s.type} anchorPhrase="${s.anchorPhrase}" palette=${s.palette} holdSec=${s.holdSec}`)
      .join("\n");

    const issuesText = (issues.length > 0 && attempt === 1)
      ? `\nDeterministic issues (weigh these signals, do not block):\n${issues.map((iss) => `- spec[${iss.specIndex}]: ${iss.kind} — ${iss.detail}`).join("\n")}\n`
      : "";

    const userPrompt = `Sentences:\n${sentenceList}\n\nOverlay specs:\n${specList}${issuesText}\nReview each overlay and determine if it amplifies the most salient fact in its anchored sentence. Return JSON.`;

    try {
      const result = await callStructured({
        schema: OverlayJudgeResponseSchema,
        system: buildOverlayJudgeSystemPrompt(),
        prompt: userPrompt,
        runName: `docu/overlay-placement-judge/attempt-${attempt}`,
        verbose: opts?.verbose,
        llm: LLM_JUDGE,
      });

      const dropSet = new Set(
        result.verdicts.filter((v) => !v.keep).map((v) => v.specIndex),
      );

      if (dropSet.size === 0) break;

      if (dropSet.size >= previousDropCount && attempt > 1) break;

      previousDropCount = dropSet.size;
      current = current.filter((_, i) => !dropSet.has(i));

      if (attempt <= MAX_OVERLAY_JUDGE_RETRIES) continue;
    } catch (err) {
      console.warn("[overlay-placement] judge call failed — returning unfiltered specs");
      return specs;
    }

    break;
  }

  return current;
}

// ── Anchor ID validation ─────────────────────────────────────────────

/**
 * The overlay LLM is shown anchors by their canonical id (e.g. [anc-001]) and
 * references them in sourceAnchorId. No remapping is needed. Any sourceAnchorId
 * that is not in the verified-anchor set is rejected (the selection is dropped)
 * rather than silently passed through — an unresolved id would otherwise fail
 * downstream sourceUrl/anchor matching silently. Surfacing the drift here is
 * preferable to hiding it.
 */
export function rejectUnknownSourceAnchorIds(
  selections: AnySelection[],
  verifiedAnchors: readonly Anchor[],
  runName: string,
): AnySelection[] {
  const validIds = new Set(verifiedAnchors.map((a) => a.id));
  return selections.filter((sel) => {
    if (!("sourceAnchorId" in sel)) return true;
    const sourceAnchorId = (sel as { sourceAnchorId?: string }).sourceAnchorId;
    if (!sourceAnchorId) return true;
    if (validIds.has(sourceAnchorId)) return true;
    console.warn(
      `[${runName}] Rejecting selection with unknown sourceAnchorId "${sourceAnchorId}" (anchorPhrase: "${sel.anchorPhrase}"). Known ids: ${Array.from(validIds).join(", ") || "(none)"}`,
    );
    return false;
  });
}

// ── Overlay selection (registry-driven, DataItem-aware) ─────────────

async function generateOverlaySelectionsImpl(
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  dataItems: DataItem[],
  hasDataItems: boolean,
  systemPrompt: string,
  runName: string,
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  const verified = anchors.filter((a) => a.status === "verified");
  const anchorLines = verified.map((a) =>
    `[${a.id}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const sentenceList = buildSentenceList(sentences);
  const dataItemListing = buildDataItemListing(dataItems);

  const dataItemsGuidance = hasDataItems
    ? `\n## Data Items (select from these for numeric overlays)\n${dataItemListing}\n\nSelect overlay placements. Remember: anchorPhrase MUST be a verbatim substring from the sentences above. For numeric types, reference a dataItemId from the Data Items list.`
    : "\n\nNo data items available. Select textual overlays only (headline-card). Do NOT select any numeric overlay types (kinetic-number, chart).";

  const baseUserPrompt = `Narration sentences:\n${sentenceList}\n\nResearch anchors:\n${anchorLines || "(no verified anchors)"}${dataItemsGuidance}`;

  const maxRetries = 2;
  let lastError: unknown;
  let numViolationContext = "";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let rawSelections: z.infer<typeof SelectionOutputSchema>;
    try {
      let userPrompt = baseUserPrompt;
      if (numViolationContext) {
        userPrompt = `${baseUserPrompt}\n\n${numViolationContext}`;
      } else if (attempt > 1) {
        userPrompt = hasDataItems
          ? `${baseUserPrompt}\n\nPrevious anchorPhrase values were not found verbatim in the sentences, or dataItemIds were invalid. Available Data Item IDs: ${dataItems.map((d) => `${d.id} (${d.kind})`).join(", ")}. Ensure every anchorPhrase is copied exactly from the sentence list above, and every dataItemId is from this list.`
          : `${baseUserPrompt}\n\nPrevious anchorPhrase values were not found verbatim in the sentences. Ensure every anchorPhrase is copied exactly from the sentence list above. Select textual overlays only — no numeric overlay types are available.`;
      }

      rawSelections = await callStructured({
        schema: SelectionOutputSchema,
        system: systemPrompt,
        prompt: userPrompt,
        runName,
        verbose: opts?.verbose,
        llm: LLM_OVERLAY,
      });
    } catch (err) {
      lastError = err;
      if (attempt <= maxRetries) {
        process.stderr.write(`[${runName}] LLM call failed on attempt ${attempt}, retrying...\n`);
        continue;
      }
      throw lastError;
    }

    const invalid = validateAnchorPhrases(
      rawSelections.selections.map((s) => ({ anchorPhrase: s.anchorPhrase })),
      sentences,
    );

    // Filter out selections with invalid anchor phrases
    let workingSelections = rawSelections.selections;
    if (invalid.length > 0) {
      if (attempt <= maxRetries) {
        process.stderr.write(
          `[${runName}] invalid anchorPhrases: ${invalid.join(", ")}. Retrying...\n`,
        );
        continue;
      }
      const invalidSet = new Set(invalid);
      workingSelections = workingSelections.filter(
        (s) => !invalidSet.has(s.anchorPhrase),
      );
      console.warn(
        `[${runName}] Dropping ${rawSelections.selections.length - workingSelections.length} selections with invalid anchorPhrases after retries exhausted`,
      );
    }

    if (workingSelections.length === 0) {
      if (attempt <= maxRetries) {
        process.stderr.write(
          `[${runName}] No valid selections remaining after anchor-phrase validation. Retrying...\n`,
        );
        continue;
      }
      throw new Error(
        `[${runName}] All selections had invalid anchorPhrases after ${maxRetries + 1} attempts. Invalid: ${invalid.join(", ")}`,
      );
    }

    // Number-agreement gate: check that numeric overlays match sentence text
    if (hasDataItems) {
      const numViolations = validateNumberAgreement(workingSelections, sentences, dataItems);

      if (numViolations.length > 0) {
        const violationDescs = numViolations.map((v) =>
          `"${v.anchorPhrase}" → dataItem ${v.dataItemId} value=${v.value}${v.unit} not found in sentence "${v.sentence}"`,
        );

        if (attempt <= maxRetries) {
          const feedbackDetail = numViolations.slice(0, 3).map((v) =>
            `The sentence "${v.sentence}" does not contain the value ${v.value}${v.unit} from data item ${v.dataItemId}. Either use a different dataItemId that matches the sentence's number, or anchor to a different sentence.`,
          ).join("\n");
          process.stderr.write(
            `[${runName}] Number-agreement violations: ${violationDescs.join("; ")}. Retrying...\n`,
          );
          numViolationContext = `Number-agreement failures:\n${feedbackDetail}\nAvailable Data Items: ${dataItems.map((d) => `${d.id}=${d.kind === "scalar" ? `${d.value}${d.unit}` : d.kind} (${d.label})`).join(", ")}`;
          continue;
        }

        // Retries exhausted: drop offending selections
        const violationIndices = new Set(numViolations.map((v) => v.index));
        workingSelections = workingSelections.filter((_, i) => !violationIndices.has(i));
        console.warn(
          `[${runName}] Dropping ${numViolations.length} selections with number-agreement violations after retries exhausted`,
        );
      }
    }

    if (workingSelections.length === 0) {
      if (!hasDataItems) {
        console.warn(`[${runName}] No data items available — accepting empty overlay set`);
        return [];
      }
      if (attempt <= maxRetries) {
        process.stderr.write(`[${runName}] No valid selections after all gates. Retrying...\n`);
        continue;
      }
      return [];
    }

    const knownAnchorSelections = rejectUnknownSourceAnchorIds(workingSelections, verified, runName);
    const specs = populateSelections(knownAnchorSelections, dataItems);

    if (specs.length === 0) {
      if (!hasDataItems) {
        console.warn(`[${runName}] No data items available — accepting empty overlay set`);
        return [];
      }
      if (attempt <= maxRetries) {
        process.stderr.write(`[${runName}] All selections failed population. Retrying...\n`);
        continue;
      }
    }

    return specs;
  }

  throw lastError ?? new Error(`[${runName}] Failed to generate overlay selections`);
}

async function generateSegmentOverlaySelections_impl(
  plan: DocuSegmentPlan,
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  dataItems: DataItem[],
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  const hasDataItems = dataItems.length > 0;
  const specs = await generateOverlaySelectionsImpl(
    sentences, anchors, dataItems, hasDataItems,
    segmentSelectionSystemPrompt(plan, hasDataItems),
    `docu/overlay-selection/seg-${String(plan.index).padStart(2, "0")}`,
    opts,
  );

  const { issues, warnings } = validateOverlayPlacement(specs, sentences);
  if (warnings.length > 0) {
    process.stderr.write(
      `[docu/overlay-placement] ${warnings.map((w) => w.detail).join("; ")}\n`,
    );
  }
  const gated = await gateOverlayPlacement(specs, sentences, issues, opts);
  if (gated.length < specs.length) {
    process.stderr.write(`[docu/overlay-placement] Dropped ${specs.length - gated.length} overlay(s) for placement/salience\n`);
  }
  return gated;
}

export const generateSegmentOverlaySelections = traceableChain(generateSegmentOverlaySelections_impl, "generateSegmentOverlaySelections", {
  processInputs: (inputs) => (textOnlyAssetSummary(inputs) as Record<string, unknown>) ?? {},
  processOutputs: (outputs) => (textOnlyAssetSummary(outputs) as Record<string, unknown>) ?? {},
});
