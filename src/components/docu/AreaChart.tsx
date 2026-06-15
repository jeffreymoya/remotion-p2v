import React from "react";
import { AbsoluteFill } from "remotion";
import { AreaChart as S2vAreaChart } from "./charts/AreaChart";
import type { DocuPalette } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { paletteToTheme } from "./s2v-adapters";

export interface AreaChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  forecastFromIndex?: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  points,
  label,
  unit,
  source,
  palette,
  durationInFrames,
  forecastFromIndex,
}) => {
  return (
    <AbsoluteFill>
      <S2vAreaChart
        points={points}
        label={label}
        unit={unit}
        source={source}
        theme={paletteToTheme(palette)}
        durationInFrames={durationInFrames}
        forecastFromIndex={forecastFromIndex}
      />
    </AbsoluteFill>
  );
};
