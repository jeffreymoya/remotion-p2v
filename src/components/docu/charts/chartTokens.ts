import { COLORS, FONT, WEIGHT } from "../common/tokens";

/**
 * Chart-domain tokens. Co-located with the chart components but still a single
 * source: geometry, the series colour ramp (derived from {@link COLORS}, not a
 * separate Bloomberg palette) and the editorial typography roles mapped onto
 * the loaded {@link FONT} families.
 */

/** Six visually distinct series colours, all drawn from the design palette. */
export const CHART_RAMP = [
  COLORS.orange,
  COLORS.blue,
  COLORS.green,
  COLORS.yellow,
  COLORS.red,
  COLORS.redDeep,
] as const;

/** Logical drawing canvas and the (larger) rendered SVG size. */
export const CHART_CANVAS = {
  viewBoxW: 1170,
  viewBoxH: 810,
  renderW: 1400,
  renderH: 970,
} as const;

/** Plot padding per chart family. */
export const CHART_PAD = {
  line: { l: 90, r: 140, t: 90, b: 90 },
  bar: { l: 90, r: 60, t: 90, b: 80 },
  hbar: { l: 240, r: 120, t: 80, b: 60 },
} as const;

/** Bottom-right source caption offset (logical canvas units). */
export const CHART_SOURCE = { xOffset: 30, yOffset: 18 } as const;

/** Donut geometry + legend layout. */
export const DONUT = {
  cx: 375,
  cy: 405,
  rOuter: 300,
  rInner: 186,
  legendGap: 72,
  legendOffset: 60,
  centerLabelYOffset: -24,
  centerValueYOffset: 32,
  swatchSize: 20,
  swatchRx: 3,
  legendLabelXOffset: 30,
  legendLabelYBaseline: 18,
  legendValueYBaseline: 46,
  sourceXOffset: 30,
  sourceYOffset: 18,
} as const;

/** Radial gauge geometry. */
export const RADIAL = {
  cy: 320,
  r: 200,
  strokeW: 34,
  tickCount: 12,
  tickGap: 8,
  tickLen: 14,
} as const;

export interface ChartTypographyRole {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  letterSpacing?: string;
  fontStyle?: string;
}

/** Editorial chart typography roles. */
export const CHART_TYPE = {
  axis: { fontFamily: FONT.mono, fontSize: 13 },
  source: { fontFamily: FONT.mono, fontSize: 13 },
  label: { fontFamily: FONT.serif, fontSize: 14, fontWeight: WEIGHT.medium },
  value: { fontFamily: FONT.serif, fontSize: 18, fontWeight: WEIGHT.semiBold },
  legendLabel: { fontFamily: FONT.serif, fontSize: 13 },
  legendValue: {
    fontFamily: FONT.serif,
    fontSize: 18,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.02em",
  },
  centerLabel: {
    fontFamily: FONT.mono,
    fontSize: 16,
    letterSpacing: "0.2em",
  },
  centerValue: {
    fontFamily: FONT.serif,
    fontSize: 54,
    fontWeight: WEIGHT.semiBold,
  },
  radialValue: {
    fontFamily: FONT.serif,
    fontSize: 88,
    fontWeight: WEIGHT.semiBold,
  },
  secondaryValue: {
    fontFamily: FONT.serif,
    fontSize: 18,
    fontStyle: "italic",
  },
  annotation: {
    fontFamily: FONT.mono,
    fontSize: 12.5,
    fontWeight: WEIGHT.semiBold,
    letterSpacing: "0.18em",
  },
} as const satisfies Record<string, ChartTypographyRole>;
