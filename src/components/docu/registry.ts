// src/components/docu/registry.ts
import type { ZodType } from "zod";
import type { ComponentMeta } from "./common/meta";

import { titleCardSchema, titleCardDefaults, titleCardMeta } from "./cards/TitleCard";
import { lowerThirdSchema, lowerThirdDefaults, lowerThirdMeta } from "./cards/LowerThirdChyron";
import { kineticNumberSchema, kineticNumberDefaults, kineticNumberMeta } from "./cards/KineticNumber";
import { redactedRevealSchema, redactedRevealDefaults, redactedRevealMeta } from "./cards/RedactedReveal";
import { markerHighlightSchema, markerHighlightDefaults, markerHighlightMeta } from "./cards/MarkerHighlight";
import { typewriterMemoSchema, typewriterMemoDefaults, typewriterMemoMeta } from "./cards/TypewriterMemo";
import { pullQuoteSchema, pullQuoteDefaults, pullQuoteMeta } from "./cards/PullQuote";
import { breakingNewsSchema, breakingNewsDefaults, breakingNewsMeta } from "./cards/BreakingNews";
import { sourceAttributionSchema, sourceAttributionDefaults, sourceAttributionMeta } from "./cards/SourceAttribution";
import { evidenceStampSchema, evidenceStampDefaults, evidenceStampMeta } from "./cards/EvidenceStamp";
import { splitCardSchema, splitCardDefaults, splitCardMeta } from "./scenes/SplitCard";
import { articleCardSchema, articleCardDefaults, articleCardMeta } from "./scenes/ArticleCard";
import { contextBarSchema, contextBarDefaults, contextBarMeta } from "./overlays/ContextBar";
import { documentaryCaptionSchema, documentaryCaptionDefaults, documentaryCaptionMeta } from "./captions/DocumentaryCaption";
import { chartSchema, chartDefaults, chartMeta } from "./charts/Chart";

/** One catalogued component: identity + schema + defaults + semantics. */
export interface RegistrySource {
  readonly name: string;
  readonly schema: ZodType;
  readonly defaults: unknown;
  readonly meta: ComponentMeta;
}

/**
 * Single source of truth the registry generator consumes. Adding a new
 * composite means adding it here; `registry:check` fails if an exported
 * `*Schema` is missing from this list.
 */
export const REGISTRY_SOURCES: readonly RegistrySource[] = [
  { name: "TitleCard", schema: titleCardSchema, defaults: titleCardDefaults, meta: titleCardMeta },
  { name: "LowerThirdChyron", schema: lowerThirdSchema, defaults: lowerThirdDefaults, meta: lowerThirdMeta },
  { name: "KineticNumber", schema: kineticNumberSchema, defaults: kineticNumberDefaults, meta: kineticNumberMeta },
  { name: "RedactedReveal", schema: redactedRevealSchema, defaults: redactedRevealDefaults, meta: redactedRevealMeta },
  { name: "MarkerHighlight", schema: markerHighlightSchema, defaults: markerHighlightDefaults, meta: markerHighlightMeta },
  { name: "TypewriterMemo", schema: typewriterMemoSchema, defaults: typewriterMemoDefaults, meta: typewriterMemoMeta },
  { name: "PullQuote", schema: pullQuoteSchema, defaults: pullQuoteDefaults, meta: pullQuoteMeta },
  { name: "BreakingNews", schema: breakingNewsSchema, defaults: breakingNewsDefaults, meta: breakingNewsMeta },
  { name: "SourceAttribution", schema: sourceAttributionSchema, defaults: sourceAttributionDefaults, meta: sourceAttributionMeta },
  { name: "EvidenceStamp", schema: evidenceStampSchema, defaults: evidenceStampDefaults, meta: evidenceStampMeta },
  { name: "SplitCard", schema: splitCardSchema, defaults: splitCardDefaults, meta: splitCardMeta },
  { name: "ArticleCard", schema: articleCardSchema, defaults: articleCardDefaults, meta: articleCardMeta },
  { name: "ContextBar", schema: contextBarSchema, defaults: contextBarDefaults, meta: contextBarMeta },
  { name: "DocumentaryCaption", schema: documentaryCaptionSchema, defaults: documentaryCaptionDefaults, meta: documentaryCaptionMeta },
  { name: "Chart", schema: chartSchema, defaults: chartDefaults, meta: chartMeta },
];
