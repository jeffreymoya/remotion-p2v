import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

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

export const FONT = {
  display: barlow.fontFamily,
  body: inter.fontFamily,
  mono: ibmPlexMono.fontFamily,
  serif: '"Times New Roman", Georgia, serif',
} as const;

/**
 * Perfect-fourth type scale (base 24px) extended with display tiers used by
 * the hero title and kinetic-number cards.
 */
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
