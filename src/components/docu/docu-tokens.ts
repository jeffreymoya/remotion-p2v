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

// ── Per-shot palette accents ───────────────────────────────────────────────
// Removed: sepia+hue-rotate fighting each other in COOL_TECH (sepia warms,
// hue-rotate cools). Simplified to coherent per-axis adjustments.
export const COOL_TECH = {
  filter: "saturate(0.75) contrast(1.20) brightness(0.95) hue-rotate(-10deg)",
  tint: "linear-gradient(to bottom, rgba(0,20,60,0.20), transparent 50%)",
  accentColor: "#00ff88",
  captionAccent: "#22d3ee",
} as const;

export const WARM_REAL = {
  filter: "saturate(1.10) contrast(1.05) brightness(1.02) sepia(0.18)",
  tint: "linear-gradient(to bottom, rgba(80,40,0,0.15), transparent 50%)",
  accentColor: "#fbbf24",
  captionAccent: "#fde68a",
} as const;

export type DocuPalette = "cool-tech" | "warm-real";

export const PALETTE_MAP = {
  "cool-tech": COOL_TECH,
  "warm-real": WARM_REAL,
} as const;

// ── Overlay text-mode palette ──────────────────────────────────────────
// Rule: cool-tech → dark bg / white text; warm-real → light bg / dark text.
// Every overlay derives its textMode from palette via paletteToTextMode().
export type OverlayTextMode = "light" | "dark";

export const OVERLAY_TEXT_PALETTE: Record<OverlayTextMode, { bg: string; textPrimary: string; textMuted: string; textInk: string }> = {
  light: {
    bg:         "rgba(0,0,0,0.7)",
    textPrimary: "#FAFAFA",
    textMuted:   "rgba(255,255,255,0.4)",
    textInk:     "#EAEAEA",
  },
  dark: {
    bg:         "rgba(255,255,255,0.85)",
    textPrimary: "#0a0a0a",
    textMuted:   "rgba(0,0,0,0.45)",
    textInk:     "#1a1a1a",
  },
} as const;

export function paletteToTextMode(palette: DocuPalette): OverlayTextMode {
  return palette === "cool-tech" ? "light" : "dark";
}

// ── Editorial chart font stack (Source Serif 4 / IBM Plex Sans / IBM Plex Mono) ──
export const FONT_SERIF_EDITORIAL = "'Source Serif 4', Georgia, serif";
export const FONT_SANS_EDITORIAL  = "'IBM Plex Sans', system-ui, sans-serif";
export const FONT_MONO_EDITORIAL  = "'IBM Plex Mono', ui-monospace, monospace";

export interface ChartTypographyRole {
  fontFamily: string;
  fontSize: number;
  fontWeight?: string | number;
  letterSpacing?: string;
  fontStyle?: string;
}

export const CHART_TYPOGRAPHY = {
  axis: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 13,
  },
  axisCompact: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 11,
  },
  source: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 13,
  },
  label: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 14,
    fontWeight: WEIGHT.medium,
  },
  labelCompact: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 12,
  },
  value: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 18,
    fontWeight: WEIGHT.semiBold,
  },
  valueCompact: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 12,
    fontWeight: WEIGHT.semiBold,
  },
  legendLabel: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 13,
  },
  legendValue: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 18,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.02em",
  },
  annotation: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 12.5,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.18em",
  },
  annotationCompact: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 9.5,
  },
  centerLabel: {
    fontFamily: FONT_MONO_EDITORIAL,
    fontSize: 16,
    letterSpacing: "0.2em",
  },
  centerValue: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 54,
    fontWeight: WEIGHT.semiBold,
  },
  radialValue: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 88,
    fontWeight: WEIGHT.semiBold,
  },
  radialValueCompact: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 76,
    fontWeight: WEIGHT.semiBold,
  },
  secondaryValue: {
    fontFamily: FONT_SERIF_EDITORIAL,
    fontSize: 18,
    fontStyle: "italic",
  },
  emptyState: {
    fontFamily: FONT_SANS_EDITORIAL,
    fontSize: 18,
  },
} as const satisfies Record<string, ChartTypographyRole>;

// ── Chart easing beziers (from bundle chart-frame.jsx) ──
export const SPRING_BEZIER: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
export const EASE_BEZIER:   [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Chart color ramps — 6-stop arrays indexed by data series ──
export type ChartColorRamp = readonly [string, string, string, string, string, string];

// Polychrome: editorial mixed-hue (navy, burnt orange, mustard, plum, olive, terracotta)
export const CHART_RAMP_POLYCHROME: ChartColorRamp = [
  '#1f4a5e', // deep teal
  '#c4571e', // burnt orange
  '#d4a942', // mustard gold
  '#7b4a8c', // plum
  '#4a7c3a', // olive green
  '#b8493b', // terracotta
];

export const CHART_RAMP_WARM: ChartColorRamp = [
  '#7a2e0e', '#b3471a', '#d4621f', '#e8853a', '#f0a958', '#f5c87a',
];

export const CHART_RAMP_COOL: ChartColorRamp = [
  '#0d2540', '#1a4071', '#2563a8', '#3987c8', '#5fb3d4', '#9ed1e3',
];

// Default ramp used by charts when no override is specified
export const CHART_RAMP_DEFAULT = CHART_RAMP_POLYCHROME;

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

export interface DonutChartStyle {
  viewBoxW: number;
  viewBoxH: number;
  renderW: number;
  renderH: number;
  cx: number;
  cy: number;
  rOuter: number;
  rInner: number;
  legendGap: number;
  legendOffset: number;
  centerLabelFontSize: number;
  centerValueFontSize: number;
  centerLabelYOffset: number;
  centerValueYOffset: number;
  legendLabelFontSize: number;
  legendValueFontSize: number;
  legendSwatchSize: number;
  legendSwatchRx: number;
  legendLabelXOffset: number;
  legendLabelYBaseline: number;
  legendValueYBaseline: number;
  sourceFontSize: number;
  sourceXOffset: number;
  sourceYOffset: number;
}

export const DEFAULT_DONUT_CHART_STYLE: DonutChartStyle = {
  viewBoxW: 1170,
  viewBoxH: 810,
  renderW: 1400,
  renderH: 970,
  cx: 375,
  cy: 405,
  rOuter: 300,
  rInner: 186,
  legendGap: 72,
  legendOffset: 60,
  centerLabelFontSize: CHART_TYPOGRAPHY.centerLabel.fontSize,
  centerValueFontSize: CHART_TYPOGRAPHY.centerValue.fontSize,
  centerLabelYOffset: -24,
  centerValueYOffset: 32,
  legendLabelFontSize: CHART_TYPOGRAPHY.legendLabel.fontSize,
  legendValueFontSize: CHART_TYPOGRAPHY.legendValue.fontSize,
  legendSwatchSize: 20,
  legendSwatchRx: 3,
  legendLabelXOffset: 30,
  legendLabelYBaseline: 18,
  legendValueYBaseline: 46,
  sourceFontSize: CHART_TYPOGRAPHY.source.fontSize,
  sourceXOffset: 30,
  sourceYOffset: 18,
};
