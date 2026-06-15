import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import type { CSSProperties } from "react";
import type { Lifecycle, TextStyle, Theme } from "./types";

/**
 * Token system for the documentary kinetic-typography components.
 * Values mirror `kinetic typography/patterns.css` `:root` and the research
 * notes in `kinetic typography/uploads/kinetic-text-typography.md`.
 *
 * This module is the single source of default render values. Components read
 * props with these tokens as fallbacks so every value stays overridable.
 */

const barlow = loadBarlowCondensed("normal", {
  weights: ["300", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const inter = loadInter("normal", {
  weights: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
});
const ibmPlexMono = loadIBMPlexMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});
const sourceSerif4 = loadSourceSerif4("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const FONT = {
  display: barlow.fontFamily,
  body: inter.fontFamily,
  mono: ibmPlexMono.fontFamily,
  serif: `${sourceSerif4.fontFamily}, Georgia, serif`,
} as const;

/** Perfect-fourth type scale (base 24px). */
export const TYPE_SCALE = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 76,
  "2xl": 100,
  "3xl": 134,
  "4xl": 180,
  "5xl": 232,
  "6xl": 320,
  "7xl": 420,
} as const;

/**
 * Bespoke display sizes used by hero cards that fall between the modular
 * `TYPE_SCALE` steps. Centralised so they are overridable and not magic numbers.
 */
export const DISPLAY_SIZE = {
  eyebrow: 26,
  titleLine2: 60,
  statLabel: 64,
  statGlyph: 220,
} as const;

export const TRACKING = {
  tight: "-0.035em",
  snug: "-0.015em",
  display: "-0.025em",
  normal: "0",
  wide: "0.04em",
  body: "0.08em",
  label: "0.24em",
  meta: "0.3em",
  kicker: "0.32em",
  eyebrow: "0.36em",
} as const;

export const LEADING = {
  none: 1.0,
  tight: 1.1,
  snug: 1.2,
  normal: 1.35,
  loose: 1.6,
} as const;

export const WEIGHT = {
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
} as const;

export const COLORS = {
  bg: "#0b0b0d",
  bg2: "#15140f",
  paper: "#ece4d0",
  paper2: "#d8cdb2",
  ink: "#14110d",
  fg: "#efe9dc",
  muted: "#8a847a",
  line: "rgba(239,233,220,0.10)",
  orange: "#D97757",
  red: "#d6362e",
  redDeep: "#8c1a16",
  yellow: "#f4c84a",
  green: "#6bbf75",
  blue: "#6b9cd9",
} as const;

export type TypeScaleToken = keyof typeof TYPE_SCALE;
export type TrackingToken = keyof typeof TRACKING;
export type LeadingToken = keyof typeof LEADING;
export type WeightToken = keyof typeof WEIGHT;
export type ColorToken = keyof typeof COLORS;

/**
 * Structural spacing constants shared across the chrome, cards and overlays.
 * Centralised so the frame outline, label rail and slide gutters stay aligned.
 */
export const SPACING = {
  /** Inset of the chrome frame outline from the slide edge. */
  frameInset: 40,
  /** Vertical position of the chrome label rail. */
  labelTop: 60,
  /** Horizontal inset of the chrome labels. */
  labelInset: 64,
  /** Length of the chrome corner accent ticks. */
  cornerLen: 64,
  /** Standard horizontal gutter for full-slide content. */
  edge: 160,
  /** Wider gutter used by document / newsroom layouts. */
  edgeWide: 180,
} as const;

/** Hairline / accent-bar thicknesses. */
export const BORDER = {
  hairline: 1,
  accentBar: 3,
  accentBarBold: 8,
} as const;

/**
 * Frame-domain animation constants. Kept here so timing tweaks live in one
 * place instead of being scattered as magic numbers across primitives.
 */
export const MOTION = {
  /** Cursor blink period (frames) for the typewriter. */
  cursorBlinkFrames: 15,
  /** Portion of a stamp's duration over which the entry blur settles. */
  stampBlurDecayPortion: 0.3,
  /** Chrome fade-in window `[start, end]` in frames. */
  chromeFadeIn: [4, 16],
  /** Default lower-third / overlay fade ramp length in frames. */
  overlayRamp: 10,
} as const;

/** Lifecycle used by most cards: instant enter, exit anchored to the end. */
export const DEFAULT_LIFECYCLE: Lifecycle = {
  delay: 0,
  inFrames: 1,
  holdFrames: 0,
  outFrames: 18,
};

/** Drop shadows for text rendered over footage / imagery. */
export const SHADOW = {
  text: "0 2px 8px rgba(0,0,0,0.8)",
  textStrong: "0 4px 16px rgba(0,0,0,0.8)",
  panel: "0 2px 8px rgba(0,0,0,0.6)",
} as const;

/** Concrete colours a {@link Theme} resolves to. */
export interface ThemeColors {
  /** Backdrop colour for chips / surfaces drawn over footage. */
  surface: string;
  /** Primary text colour. */
  text: string;
  /** Muted / secondary text colour. */
  muted: string;
  /** Default accent colour. */
  accent: string;
}

/**
 * Resolve a {@link Theme} to concrete token colours. Replaces the source
 * library's `DocuPalette` / `OVERLAY_TEXT_PALETTE` / `paletteToTextMode`
 * indirection with a single helper backed by {@link COLORS}.
 */
export const resolveTheme = (theme: Theme): ThemeColors =>
  theme === "light"
    ? {
        surface: "rgba(236,228,208,0.92)",
        text: COLORS.ink,
        muted: "rgba(20,17,13,0.55)",
        accent: COLORS.orange,
      }
    : {
        surface: "rgba(11,11,13,0.78)",
        text: COLORS.fg,
        muted: COLORS.muted,
        accent: COLORS.orange,
      };

/**
 * Build a {@link TextStyle} from tokens, filling sensible defaults so call
 * sites only specify what differs. Replaces the repeated inline `TextStyle`
 * object literals across the cards.
 */
export const textStyle = (o: {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: number;
  letterSpacing?: string;
  lineHeight?: number;
  color: string;
  textTransform?: CSSProperties["textTransform"];
}): TextStyle => ({
  fontFamily: o.fontFamily ?? FONT.body,
  fontSize: o.fontSize,
  fontWeight: o.fontWeight ?? WEIGHT.regular,
  letterSpacing: o.letterSpacing ?? TRACKING.normal,
  lineHeight: o.lineHeight ?? LEADING.normal,
  color: o.color,
  textTransform: o.textTransform,
});
