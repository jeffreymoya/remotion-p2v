import React from "react";
import { AbsoluteFill } from "remotion";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { ChartKind } from "../../lib/docu/overlays/chart";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { DonutChart as S2vDonutChart } from "./charts/DonutChart";
import { LineChart as S2vLineChart } from "./charts/LineChart";
import { BarChart as S2vBarChart } from "./charts/BarChart";
import { HorizontalBarChart as S2vHorizontalBarChart } from "./charts/HorizontalBarChart";
import { AreaChart as S2vAreaChart } from "./charts/AreaChart";
import { RadialChart as S2vRadialChart } from "./charts/RadialChart";
import { paletteToTheme } from "./s2v-adapters";

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

type S2vChartComponent =
  | typeof S2vDonutChart
  | typeof S2vLineChart
  | typeof S2vBarChart
  | typeof S2vHorizontalBarChart
  | typeof S2vAreaChart
  | typeof S2vRadialChart;

function renderChart(Component: S2vChartComponent, props: ChartRenderProps): React.ReactElement {
  return (
    <AbsoluteFill>
      <Component
        label={props.label}
        points={props.points}
        unit={props.unit}
        source={props.source}
        theme={paletteToTheme(props.palette)}
        durationInFrames={props.durationInFrames}
        forecastFromIndex={props.forecastFromIndex}
      />
    </AbsoluteFill>
  );
}

export const CHART_REGISTRY: Record<ChartKind, React.FC<ChartRenderProps>> = {
  composition: (props) => renderChart(S2vDonutChart, props),
  timeseries: (props) => renderChart(S2vLineChart, props),
  comparison: (props) => renderChart(S2vBarChart, props),
  "horizontal-bar": (props) => renderChart(S2vHorizontalBarChart, props),
  area: (props) => renderChart(S2vAreaChart, props),
  radial: (props) => renderChart(S2vRadialChart, props),
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
