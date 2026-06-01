import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { DocuChart } from "./DocuChart";

const PER_CHART = 90;

export const ChartShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={PER_CHART}>
        <DocuChart
          chartKind="timeseries"
          label="Fed Funds Rate"
          points={[{ x: "2019", y: 2.4 }, { x: "2020", y: 0.25 }, { x: "2021", y: 0.25 }, { x: "2022", y: 3.0 }, { x: "2023", y: 5.25 }, { x: "2024", y: 4.5 }]}
          unit="%"
          palette="cool-tech"
          durationInFrames={PER_CHART}
        />
      </Sequence>
      <Sequence from={PER_CHART} durationInFrames={PER_CHART}>
        <DocuChart
          chartKind="comparison"
          label="GDP by Sector"
          points={[{ x: "Finance", y: 22 }, { x: "Tech", y: 18 }, { x: "Healthcare", y: 15 }, { x: "Manufacturing", y: 12 }, { x: "Retail", y: 9 }]}
          unit="%"
          palette="warm-real"
          durationInFrames={PER_CHART}
        />
      </Sequence>
      <Sequence from={PER_CHART * 2} durationInFrames={PER_CHART}>
        <DocuChart
          chartKind="horizontal-bar"
          label="AI Startup Valuations"
          points={[{ x: "Lumen AI", y: 340 }, { x: "Cortex", y: 183 }, { x: "Nimbus", y: 75 }, { x: "Glyph", y: 28 }, { x: "Sift", y: 14 }]}
          unit="B"
          palette="cool-tech"
          durationInFrames={PER_CHART}
        />
      </Sequence>
      <Sequence from={PER_CHART * 3} durationInFrames={PER_CHART}>
        <DocuChart
          chartKind="area"
          label="ARR Growth"
          points={[
            { x: "Jul", y: 2.4 }, { x: "Aug", y: 2.9 }, { x: "Sep", y: 3.5 }, { x: "Oct", y: 4.1 }, { x: "Nov", y: 4.8 }, { x: "Dec", y: 5.6 },
            { x: "Jan", y: 6.7 }, { x: "Feb", y: 8.1 }, { x: "Mar", y: 9.8 }, { x: "Apr", y: 11.5 }, { x: "May", y: 13.2 }, { x: "Jun", y: 14.8 },
          ]}
          unit="$"
          palette="cool-tech"
          durationInFrames={PER_CHART}
          forecastFromIndex={9}
        />
      </Sequence>
      <Sequence from={PER_CHART * 4} durationInFrames={PER_CHART}>
        <DocuChart
          chartKind="radial"
          label="Series B · 2026"
          points={[{ x: "raised", y: 87 }, { x: "target", y: 120 }]}
          unit="$"
          palette="cool-tech"
          durationInFrames={PER_CHART}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
