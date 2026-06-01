import React from "react";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { ChartKind } from "../../lib/docu/overlays/chart";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { DonutChart } from "./DonutChart";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { AreaChart } from "./AreaChart";
import { RadialChart } from "./RadialChart";

export interface DocuChartProps {
  chartKind: ChartKind;
  label: string;
  points: Array<{ x: string | number; y: number }>;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  forecastFromIndex?: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

// Shared render props passed to every chart component. Components ignore the
// extra fields they do not use (e.g. only AreaChart reads forecastFromIndex).
interface ChartRenderProps {
  label: string;
  points: Array<{ x: string | number; y: number }>;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  forecastFromIndex?: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const CHART_REGISTRY: Record<ChartKind, React.FC<ChartRenderProps>> = {
  composition: DonutChart,
  timeseries: LineChart,
  comparison: BarChart,
  "horizontal-bar": HorizontalBarChart,
  area: AreaChart,
  radial: RadialChart,
};

export const DocuChart: React.FC<DocuChartProps> = ({ chartKind, enter, enterParams, ...rest }) => {
  const ChartComponent = CHART_REGISTRY[chartKind];
  return (
    <ChartComponent
      label={rest.label}
      points={rest.points}
      unit={rest.unit}
      source={rest.source}
      palette={rest.palette}
      durationInFrames={rest.durationInFrames}
      forecastFromIndex={rest.forecastFromIndex}
      enter={enter}
      enterParams={enterParams}
    />
  );
};
