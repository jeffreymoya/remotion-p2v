import React from "react";
import { z } from "zod";
import type { BlockEntry } from "../../lib/component-catalog";
import type { AssetResolver } from "../asset-resolver";

// ── Block module imports ────────────────────────────────────────────────
import * as ContradictionHookMod from "./ContradictionHook";
import * as CostOfIgnoranceHookMod from "./CostOfIgnoranceHook";
import * as HiddenMechanismHookMod from "./HiddenMechanismHook";
import * as MythVsEvidenceHookMod from "./MythVsEvidenceHook";
import * as PromiseCardMod from "./PromiseCard";
import * as ContextCardMod from "./ContextCard";
import * as DiagramSceneMod from "./DiagramScene";
import * as ComparisonSplitMod from "./ComparisonSplit";
import * as BRollMod from "./BRoll";
import * as CalloutMod from "./Callout";
import * as MicroQuestionMod from "./MicroQuestion";
import * as ContrastRevealMod from "./ContrastReveal";
import * as RevealMod from "./Reveal";
import * as ReframeMod from "./Reframe";
import * as MiniPayoffMod from "./MiniPayoff";
import * as ForeshadowMod from "./Foreshadow";
import * as StatCounterMod from "./StatCounter";

// ── Single source of truth ─────────────────────────────────────────────
// Each module exports { schema, catalogEntry, Component }.
// Adding a block = create the block file + add one entry here.

const BLOCK_MODULES = [
  ContradictionHookMod,
  CostOfIgnoranceHookMod,
  HiddenMechanismHookMod,
  MythVsEvidenceHookMod,
  PromiseCardMod,
  ContextCardMod,
  DiagramSceneMod,
  ComparisonSplitMod,
  BRollMod,
  CalloutMod,
  MicroQuestionMod,
  ContrastRevealMod,
  RevealMod,
  ReframeMod,
  MiniPayoffMod,
  ForeshadowMod,
  StatCounterMod,
] as const;

// ── Derived registries ──────────────────────────────────────────────────

export const BLOCK_CATALOG: BlockEntry[] = BLOCK_MODULES.map((m) => m.catalogEntry);

// Construct from concrete schemas so Zod preserves discriminable types
export const SceneBlock = z.discriminatedUnion("type", [
  ContradictionHookMod.schema,
  CostOfIgnoranceHookMod.schema,
  HiddenMechanismHookMod.schema,
  MythVsEvidenceHookMod.schema,
  PromiseCardMod.schema,
  ContextCardMod.schema,
  DiagramSceneMod.schema,
  ComparisonSplitMod.schema,
  BRollMod.schema,
  CalloutMod.schema,
  MicroQuestionMod.schema,
  ContrastRevealMod.schema,
  RevealMod.schema,
  ReframeMod.schema,
  MiniPayoffMod.schema,
  ForeshadowMod.schema,
  StatCounterMod.schema,
]);
export type SceneBlockType = z.infer<typeof SceneBlock>;

type BlockMapType = Record<
  string,
  React.FC<any & { frame: number; resolveAsset: AssetResolver }>
>;

export const BLOCK_MAP: BlockMapType = Object.fromEntries(
  BLOCK_MODULES.map((m) => [m.catalogEntry.name, m.Component]),
);
