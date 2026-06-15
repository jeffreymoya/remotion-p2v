import React from "react";
import { AbsoluteFill } from "remotion";
import { DonutChart as S2vDonutChart } from "./charts/DonutChart";
import type { DocuPalette, DonutChartStyle } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { paletteToTheme } from "./s2v-adapters";

export interface DonutChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  chartStyle?: Partial<DonutChartStyle>;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  points,
  label,
  unit,
  source,
  palette,
  durationInFrames,
}) => {
  return (
    <AbsoluteFill>
      <S2vDonutChart
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
