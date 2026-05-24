import { z } from "zod";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { OverlaySpec, OverlayOutput, OverlayDef } from "./overlays/registry";
import {
  OverlayOutputSchema,
  OVERLAY_REGISTRY,
  PROMPTABLE_REGISTRY,
  type SelectionInput,
} from "./overlays/registry";
import type { DataItem, DataItemKind } from "./overlays/types";
import { normalizeToken } from "./overlays/anchor-strategies";
import { callStructured } from "./llm-client";
import { LLM_OVERLAY } from "../config";
import {
  llmSegmentOverlaySelectionPrompt,
  llmOverlayLegacyPrompt,
  llmSegmentOverlayLegacyPrompt,
} from "../prompts";
import type { DocuSegmentPlan } from "./segment-types";
import type { DocuPalette } from "../../components/docu/docu-tokens";

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

function segmentSelectionSystemPrompt(plan: DocuSegmentPlan): string {
  return llmSegmentOverlaySelectionPrompt({
    role: plan.role,
    title: plan.title,
    intent: plan.intent,
    menu: buildPromtableMenu(),
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

function mapToOverlaySpecs(rawOverlays: OverlayOutput["overlays"]): OverlaySpec[] {
  return rawOverlays as unknown as OverlaySpec[];
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

// ── Old path (backward compat, hand-authored topics) ──────────────────

function buildLegacyRulesAndExamples(): { rules: string; examples: string } {
  const outputTypes = new Set(["headline-card", "kinetic-number"]);
  const entries = Object.entries(PROMPTABLE_REGISTRY).filter(([type]) => outputTypes.has(type));
  const rules = entries.map(([, def]) => `  ${def.promptRule}`).join("\n");
  const examples = entries
    .filter(([, def]) => def.promptExample)
    .map(([type, def]) => `  ${type}: ${def.promptExample}`)
    .join("\n");
  return { rules, examples };
}

function buildSystemPromptOld(): string {
  const { rules, examples } = buildLegacyRulesAndExamples();
  return llmOverlayLegacyPrompt(rules, examples);
}

function buildSegmentSystemPromptOld(plan: DocuSegmentPlan): string {
  const { rules, examples } = buildLegacyRulesAndExamples();
  return llmSegmentOverlayLegacyPrompt({
    role: plan.role,
    title: plan.title,
    intent: plan.intent,
    rules,
    examples,
  });
}

async function generateOverlaysImpl(
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  systemPrompt: string,
  runName: string,
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  const verified = anchors.filter((a) => a.status === "verified").slice(0, 20);
  const anchorLines = verified.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const sentenceList = buildSentenceList(sentences);

  const baseUserPrompt = `Narration sentences:\n${sentenceList}\n\nResearch anchors:\n${anchorLines || "(no verified anchors)"}\n\nProduce overlays. Remember: anchorPhrase MUST be a verbatim substring from the sentences above.`;

  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let rawOverlays: OverlayOutput;
    try {
      const userExtra = attempt > 1
        ? `${baseUserPrompt}\n\nPrevious anchorPhrase values were not found verbatim in the sentences. Ensure every anchorPhrase is copied exactly from the sentence list above.`
        : baseUserPrompt;

      rawOverlays = await callStructured({
        schema: OverlayOutputSchema,
        system: systemPrompt,
        prompt: userExtra,
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

    const invalid = validateAnchorPhrases(rawOverlays.overlays, sentences);

    if (invalid.length === 0) {
      return mapToOverlaySpecs(rawOverlays.overlays);
    }

    if (attempt <= maxRetries) {
      process.stderr.write(
        `[${runName}] invalid anchorPhrases: ${invalid.join(", ")}. Retrying...\n`,
      );
    } else {
      const invalidSet = new Set(invalid);
      const validOverlays = rawOverlays.overlays.filter(
        (o) => !invalidSet.has(o.anchorPhrase),
      );
      if (validOverlays.length === 0) {
        throw new Error(
          `[${runName}] All overlays had invalid anchorPhrases after ${maxRetries + 1} attempts. Invalid: ${invalid.join(", ")}`,
        );
      }
      console.warn(
        `[${runName}] Dropping ${rawOverlays.overlays.length - validOverlays.length} overlays with invalid anchorPhrases after retries exhausted`,
      );
      return mapToOverlaySpecs(validOverlays);
    }
  }

  throw lastError;
}

// ── Old export (backward compat, hand-authored fallback) ──────────────

export async function generateSegmentOverlays(
  plan: DocuSegmentPlan,
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  return generateOverlaysImpl(
    sentences,
    anchors,
    buildSegmentSystemPromptOld(plan),
    `docu/overlay/seg-${String(plan.index).padStart(2, "0")}`,
    opts,
  );
}

// ── New Phase 2 exports (registry-driven, DataItem-aware) ─────────────

async function generateOverlaySelectionsImpl(
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  dataItems: DataItem[],
  systemPrompt: string,
  runName: string,
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  const verified = anchors.filter((a) => a.status === "verified");
  const anchorLines = verified.map((a, i) =>
    `[anc-${i + 1}] ${a.claim} / ${a.detail}` +
    (a.attribution.year ? ` / ${a.attribution.year}` : "") +
    (a.attribution.person ? ` / ${a.attribution.person}` : "")
  ).join("\n");

  const sentenceList = buildSentenceList(sentences);
  const dataItemListing = buildDataItemListing(dataItems);

  const baseUserPrompt = `Narration sentences:\n${sentenceList}\n\nResearch anchors:\n${anchorLines || "(no verified anchors)"}\n\n## Data Items (select from these for numeric overlays)\n${dataItemListing}\n\nSelect overlay placements. Remember: anchorPhrase MUST be a verbatim substring from the sentences above. For numeric types, reference a dataItemId from the Data Items list.`;

  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    let rawSelections: z.infer<typeof SelectionOutputSchema>;
    try {
      const userExtra = attempt > 1
        ? `${baseUserPrompt}\n\nPrevious anchorPhrase values were not found verbatim in the sentences, or dataItemIds were invalid. Available Data Item IDs: ${dataItems.map((d) => `${d.id} (${d.kind})`).join(", ")}. Ensure every anchorPhrase is copied exactly from the sentence list above, and every dataItemId is from this list.`
        : baseUserPrompt;

      rawSelections = await callStructured({
        schema: SelectionOutputSchema,
        system: systemPrompt,
        prompt: userExtra,
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

    if (invalid.length > 0) {
      if (attempt <= maxRetries) {
        process.stderr.write(
          `[${runName}] invalid anchorPhrases: ${invalid.join(", ")}. Retrying...\n`,
        );
        continue;
      }
      const invalidSet = new Set(invalid);
      const validSelections = rawSelections.selections.filter(
        (s: AnySelection) => !invalidSet.has(s.anchorPhrase),
      );
      if (validSelections.length === 0) {
        throw new Error(
          `[${runName}] All selections had invalid anchorPhrases after ${maxRetries + 1} attempts. Invalid: ${invalid.join(", ")}`,
        );
      }
      console.warn(
        `[${runName}] Dropping ${rawSelections.selections.length - validSelections.length} selections with invalid anchorPhrases after retries exhausted`,
      );
      const specs = populateSelections(validSelections, dataItems);
      return specs;
    }

    const specs = populateSelections(rawSelections.selections, dataItems);

    if (specs.length === 0 && attempt <= maxRetries) {
      process.stderr.write(`[${runName}] All selections failed population. Retrying...\n`);
      continue;
    }

    return specs;
  }

  throw lastError ?? new Error(`[${runName}] Failed to generate overlay selections`);
}

export async function generateSegmentOverlaySelections(
  plan: DocuSegmentPlan,
  sentences: SentenceDef[],
  anchors: readonly Anchor[],
  dataItems: DataItem[],
  opts?: { verbose?: boolean },
): Promise<OverlaySpec[]> {
  return generateOverlaySelectionsImpl(
    sentences, anchors, dataItems,
    segmentSelectionSystemPrompt(plan),
    `docu/overlay-selection/seg-${String(plan.index).padStart(2, "0")}`,
    opts,
  );
}
