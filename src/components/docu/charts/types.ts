import type { ChartPoint, Theme, Unit } from "../common/types";

/**
 * Props shared by every chart. The `Chart` dispatcher passes the full set;
 * individual charts read only what they render (e.g. only the area chart uses
 * `forecastFromIndex`, only donut/radial render `label`).
 */
export interface BaseChartProps {
  points: ChartPoint[];
  label: string;
  unit?: Unit;
  source?: string;
  theme?: Theme;
  /** Animation span; defaults to the composition duration. */
  durationInFrames?: number;
}
