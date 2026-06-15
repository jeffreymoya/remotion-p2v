import React from "react";
import { z } from "zod";
import { zChartKind, zChartPoint, zTheme, zUnit } from "../common/schemas";
import { resolveProps } from "../common/resolveProps";
import { AreaChart } from "./AreaChart";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { LineChart } from "./LineChart";
import { RadialChart } from "./RadialChart";

export const chartSchema = z.object({
  kind: zChartKind,
  label: z.string(),
  points: z.array(zChartPoint),
  unit: zUnit.optional(),
  source: z.string().optional(),
  theme: zTheme.optional(),
  durationInFrames: z.number().optional(),
  forecastFromIndex: z.number().optional(),
});

export type ChartProps = z.infer<typeof chartSchema>;

export const chartDefaults: ChartProps = {
  kind: "timeseries",
  label: "Client outflows",
  points: [
    { x: "Q1", y: 12 },
    { x: "Q2", y: 18 },
    { x: "Q3", y: 9 },
    { x: "Q4", y: 27 },
    { x: "Q5", y: 41 },
  ],
  unit: "%",
  source: "SEC Filing 10-K · Internal Audit, Mar 2025",
  theme: "dark",
};

import { defineMeta } from "../common/meta";

export const chartMeta = defineMeta({
  tier: "composite",
  category: "data",
  purpose: "Dispatcher for line/area/bar/donut/radial charts by kind.",
  whenToUse: "Visualise a dataset or trend (time series, comparison, composition).",
  scriptCues: ["chart", "graph", "data", "trend", "over time", "inflation", "growth", "compound", "index", "distribution"],
  composes: ["LineChart", "AreaChart", "BarChart", "HorizontalBarChart", "DonutChart", "RadialChart"],
  canonicalExample: "src/components/docu/charts/Chart.tsx",
});

/**
 * Dispatches to the concrete chart for `kind`. Props are validated at the
 * boundary so an unsupported `kind` fails loudly instead of rendering nothing.
 */
export const Chart: React.FC<Partial<ChartProps>> = (props) => {
  const p = resolveProps(chartSchema, chartDefaults, props);
  const { kind, forecastFromIndex, ...base } = p;
  switch (kind) {
    case "composition":
      return <DonutChart {...base} />;
    case "timeseries":
      return <LineChart {...base} />;
    case "comparison":
      return <BarChart {...base} />;
    case "horizontal-bar":
      return <HorizontalBarChart {...base} />;
    case "area":
      return <AreaChart {...base} forecastFromIndex={forecastFromIndex} />;
    case "radial":
      return <RadialChart {...base} />;
    default: {
      const _exhaustive: never = kind;
      throw new Error(
        `Chart: unsupported kind "${String(_exhaustive)}" — expected one of ${zChartKind.options.join(", ")}.`,
      );
    }
  }
};
