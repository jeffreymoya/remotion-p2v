import type { CSSProperties } from "react";
import { EasingPreset } from "./easing";

/** Absolute-positioning anchor for a card element. */
export interface Position {
  inset?: number | string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
}

/** Resolved text style applied directly to a DOM node. */
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
  color: string;
  textTransform?: CSSProperties["textTransform"];
}

/**
 * Entrance → hold → optional exit timing, expressed in frames relative to the
 * start of the enclosing Sequence.
 */
export interface Lifecycle {
  delay: number;
  inFrames: number;
  holdFrames: number;
  outFrames: number;
}

export type SplitMode = "word" | "char";

/** Per-element transform applied during a staggered split-text reveal. */
export interface SplitTransforms {
  opacityFrom: number;
  y: number;
  blur: number;
  scale: number;
}

export interface Split {
  mode: SplitMode;
  stagger: number;
  transforms: SplitTransforms;
  easing: EasingPreset;
}

/** A run of text that may be emphasized (accent-coloured / heavier weight). */
export interface TextSegment {
  text: string;
  emphasis?: boolean;
}
