import React from "react";
import { AbsoluteFill } from "remotion";
import { HorizontalBarChart as S2vHorizontalBarChart } from "./charts/HorizontalBarChart";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { paletteToTheme } from "./s2v-adapters";

export interface HorizontalBarChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  points,
  label,
  unit,
  source,
  palette,
  durationInFrames,
}) => {
  return (
    <AbsoluteFill>
      <S2vHorizontalBarChart
        points={points}
        label={label}
        unit={unit}
        source={source}
        theme={paletteToTheme(palette)}
        durationInFrames={durationInFrames}
      />
    </AbsoluteFill>
  );
};
