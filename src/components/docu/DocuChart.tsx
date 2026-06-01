import React from "react";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { DonutChart } from "./DonutChart";
import { LineChart } from "./LineChart";
import { BarChart } from "./BarChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { StackedBarChart } from "./StackedBarChart";
import { AreaChart } from "./AreaChart";
import { BubbleChart } from "./BubbleChart";
import { RadialChart } from "./RadialChart";

export interface DocuChartProps {
  chartKind: "timeseries" | "comparison" | "composition"
    | "horizontal-bar" | "stacked-bar" | "area" | "bubble" | "radial";
  label: string;
  points: Array<{ x: string | number; y: number }>;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  series?: Array<{ name: string; points: Array<{ x: string | number; y: number }> }>;
  forecastFromIndex?: number;
  bubblePoints?: Array<{ name: string; x: number; y: number; r: number; highlight?: boolean }>;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const DocuChart: React.FC<DocuChartProps> = ({ enter, enterParams, ...props }) => {
  const { chartKind } = props;

  const chartEnter = enter as EnterPresetKey | undefined;

  switch (chartKind) {
    case "composition":
      return (
        <DonutChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "timeseries":
      return (
        <LineChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "comparison":
      return (
        <BarChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "horizontal-bar":
      return (
        <HorizontalBarChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "stacked-bar":
      return (
        <StackedBarChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          series={props.series}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "area":
      return (
        <AreaChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          forecastFromIndex={props.forecastFromIndex}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "bubble":
      return (
        <BubbleChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          bubblePoints={props.bubblePoints}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
    case "radial":
      return (
        <RadialChart
          points={props.points}
          label={props.label}
          unit={props.unit}
          source={props.source}
          palette={props.palette}
          durationInFrames={props.durationInFrames}
          enter={chartEnter}
          enterParams={enterParams}
        />
      );
  }
};
