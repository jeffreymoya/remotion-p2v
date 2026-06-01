import { z } from "zod";
import type { ZodType } from "zod";
import { headlineCardDef } from "./headline-card";
import { kineticNumberDef } from "./kinetic-number";
import { splitCardDef } from "./split-card";
import { contextBarDef } from "./context-bar";
import { titleCardOverlayDef } from "./title-card-overlay";
import { articleCardDef } from "./article-card";
import { chartDef } from "./chart";
import type { AnchorStrategy, DataItemKind, DataItem, OverlayCategory } from "./types";

// Note: "overlay" in OverlaySpec/OverlayDef covers both composited overlays
// (surface: "overlay") and full-frame scene cards (surface: "scene").

export interface SelectionInput {
  type: string;
  anchorPhrase: string;
  holdSec: number;
  leadSec?: number;
  palette: string;
  text?: string;
  source?: string;
}

export type PopulatorFn = (dataItem: DataItem, selection: SelectionInput) => Record<string, unknown>;

export type OverlayDef<S extends ZodType = ZodType> = {
  id: string;
  schema: S;
  anchorStrategy: AnchorStrategy;
  promptRule: string;
  promotable: boolean;
  promptExample: string;
  mixWeight: number;
  placementHint?: string;
  surface: "overlay" | "scene";
  placement: "llm" | "manual";
  category: OverlayCategory;
  consumes: DataItemKind | "anchor";
  consumesKinds?: ReadonlyArray<DataItemKind>;
  populate?: PopulatorFn;
};

function createRegistry<T extends Record<string, OverlayDef>>(reg: T): T {
  return reg;
}

export const OVERLAY_REGISTRY = createRegistry({
  "headline-card": headlineCardDef,
  "kinetic-number": kineticNumberDef,
  "split-card": splitCardDef,
  "context-bar": contextBarDef,
  "title-card": titleCardOverlayDef,
  "article-card": articleCardDef,
  "chart": chartDef,
});

export type OverlayTypeId = keyof typeof OVERLAY_REGISTRY;

export const OverlaySpecSchema = z.discriminatedUnion("type", [
  OVERLAY_REGISTRY["headline-card"].schema,
  OVERLAY_REGISTRY["kinetic-number"].schema,
  OVERLAY_REGISTRY["split-card"].schema,
  OVERLAY_REGISTRY["context-bar"].schema,
  OVERLAY_REGISTRY["title-card"].schema,
  OVERLAY_REGISTRY["article-card"].schema,
  OVERLAY_REGISTRY["chart"].schema,
]);

type RegistrySchemas = typeof OVERLAY_REGISTRY;
type AllOverlaySpecs = {
  [K in keyof RegistrySchemas]: z.infer<RegistrySchemas[K]["schema"]>;
};
export type OverlaySpec = AllOverlaySpecs[keyof AllOverlaySpecs];

type __ParityAssert<T extends true> = T;
type __OverlayParity1 = __ParityAssert<OverlaySpec extends z.infer<typeof OverlaySpecSchema> ? true : false>;
type __OverlayParity2 = __ParityAssert<z.infer<typeof OverlaySpecSchema> extends OverlaySpec ? true : false>;

export const PROMPTABLE_REGISTRY = Object.fromEntries(
  Object.entries(OVERLAY_REGISTRY).filter(([, def]) => def.promotable),
) as Record<string, OverlayDef>;

type Resolved<T> = T extends any
  ? Omit<T, "anchorPhrase" | "holdSec" | "leadSec"> & { startFrame: number; endFrame: number }
  : never;
export type DocuOverlay = Resolved<OverlaySpec>;

export function getAnchorStrategy(type: OverlayTypeId): AnchorStrategy {
  return OVERLAY_REGISTRY[type].anchorStrategy;
}
