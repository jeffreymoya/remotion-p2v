// src/components/docu/common/meta.ts

/** Authoring tier in the three-tier model. */
export type ComponentTier = "primitive" | "composite" | "scene";

/** Allowed coarse groupings. Keep in sync with the gate's category check. */
export const COMPONENT_CATEGORIES = [
  "title",
  "lower-third",
  "data",
  "comparison",
  "overlay",
  "caption",
  "document",
  "headline",
  "evidence",
  "quote",
  "citation",
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

/**
 * Hand-authored semantics merged into the generated registry so an automated
 * agent can choose a component for a script beat (not just fill its props).
 */
export interface ComponentMeta {
  /** Authoring tier this component belongs to. */
  readonly tier: ComponentTier;
  /** Coarse grouping, constrained to {@link COMPONENT_CATEGORIES}. */
  readonly category: ComponentCategory;
  /** One-line statement of what the component is for. */
  readonly purpose: string;
  /** Guidance on when to select this component over alternatives. */
  readonly whenToUse: string;
  /** Keywords mapping a script beat to this component. */
  readonly scriptCues: readonly string[];
  /** Lower-tier pieces this component composes (best-effort, may be empty). */
  readonly composes: readonly string[];
  /** Path to a concrete usage/source example to imitate when extending. */
  readonly canonicalExample: string;
}

/** Identity helper giving editor autocompletion and type-checking on meta blocks. */
export const defineMeta = (meta: ComponentMeta): ComponentMeta => meta;
