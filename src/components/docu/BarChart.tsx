import React from "react";
import { AbsoluteFill } from "remotion";
import { BarChart as S2vBarChart } from "./charts/BarChart";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { paletteToTheme } from "./s2v-adapters";

export interface BarChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const BarChart: React.FC<BarChartProps> = ({
  points,
  label,
  unit,
  source,
  palette,
  durationInFrames,
}) => {
  return (
    <AbsoluteFill>
      <S2vBarChart
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
