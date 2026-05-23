import { Easing } from "remotion";

export const FONT_DISPLAY = "Barlow Condensed";
export const FONT_BODY = "Inter";

export const TYPE_SCALE = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 76,
  "2xl": 100,
  "3xl": 134,
} as const;

export const WEIGHT = {
  light: "300",
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
  black: "900",
} as const;

export const TRACKING = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.04em",
  xwide: "0.08em",
} as const;

export const LEADING = {
  none: 1.0,
  tight: 1.1,
  snug: 1.2,
  normal: 1.35,
} as const;

export const COOL_TECH = {
  filter: "saturate(0.7) contrast(1.25) brightness(0.95) hue-rotate(-15deg) sepia(0.1)",
  vignette:
    "radial-gradient(ellipse at center, transparent 35%, rgba(0,10,30,0.65) 100%)",
  tint: "linear-gradient(to bottom, rgba(0,20,60,0.20), transparent 50%)",
  accentColor: "#00ff88",
  captionAccent: "#22d3ee",
} as const;

export const WARM_REAL = {
  filter:
    "saturate(1.10) contrast(1.05) brightness(1.02) sepia(0.15) hue-rotate(5deg)",
  vignette:
    "radial-gradient(ellipse at center, transparent 40%, rgba(30,10,0,0.55) 100%)",
  tint: "linear-gradient(to bottom, rgba(80,40,0,0.15), transparent 50%)",
  accentColor: "#fbbf24",
  captionAccent: "#fde68a",
} as const;

export type DocuPalette = "cool-tech" | "warm-real";

export const PALETTE_MAP = {
  "cool-tech": COOL_TECH,
  "warm-real": WARM_REAL,
} as const;

export const BLOOMBERG_ORANGE = "#FF6B00";
export const BLOOMBERG_YELLOW = "#FFC200";
export const BLOOMBERG_GRADIENT = `linear-gradient(to right, ${BLOOMBERG_ORANGE}, ${BLOOMBERG_YELLOW})`;

export const HEADLINE_ENTER_FRAMES = 12;
export const HEADLINE_EXIT_FRAMES = 8;
export const docuEasing = { snap: Easing.bezier(0.22, 1, 0.36, 1) } as const;

export interface KineticNumberStyle {
  labelFontSize: number;
  labelFontWeight: string;
  labelColor: string;
  labelMarginBottom: number;
  valueFontSize: number;
  valueFontWeight: string;
  gradientStart: string;
  gradientEnd: string;
  positionLeftPct: number;
  positionTopPct: number;
}

export interface HeadlineCardStyle {
  headlineFontSize: number;
  headlineFontWeight: string;
  headlineColor: string;
  sourceFontSize: number;
  sourceFontWeight: string;
  sourceColor: string;
  accentBarColor: string;
  bottomOffset: number;
  leftOffset: number;
}

export const DEFAULT_KINETIC_NUMBER_STYLE: KineticNumberStyle = {
  labelFontSize: 32,
  labelFontWeight: "300",
  labelColor: "#94a3b8",
  labelMarginBottom: 16,
  valueFontSize: 134,
  valueFontWeight: "900",
  gradientStart: BLOOMBERG_ORANGE,
  gradientEnd: BLOOMBERG_YELLOW,
  positionLeftPct: 50,
  positionTopPct: 40,
};

export const DEFAULT_HEADLINE_CARD_STYLE: HeadlineCardStyle = {
  headlineFontSize: 56,
  headlineFontWeight: "700",
  headlineColor: BLOOMBERG_ORANGE,
  sourceFontSize: 24,
  sourceFontWeight: "300",
  sourceColor: "#94a3b8",
  accentBarColor: BLOOMBERG_ORANGE,
  bottomOffset: 80,
  leftOffset: 80,
};
