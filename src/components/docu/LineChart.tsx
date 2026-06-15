import React from "react";
import { AbsoluteFill } from "remotion";
import { LineChart as S2vLineChart } from "./charts/LineChart";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { paletteToTheme } from "./s2v-adapters";

export interface LineChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const LineChart: React.FC<LineChartProps> = ({
  points,
  label,
  unit,
  source,
  palette,
  durationInFrames,
}) => {
  return (
    <AbsoluteFill>
      <S2vLineChart
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
