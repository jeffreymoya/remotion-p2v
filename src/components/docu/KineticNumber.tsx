import React from "react";
import { AbsoluteFill } from "remotion";
import { KineticNumber as S2vKineticNumber } from "./cards/KineticNumber";
import type { DocuPalette, KineticNumberStyle } from "./docu-tokens";
import { PALETTE_MAP } from "./docu-tokens";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { kineticDisplay, paletteToTheme } from "./s2v-adapters";

interface KineticNumberProps {
  label: string;
  value: number;
  unit: OverlayUnit;
  durationFrames: number;
  palette: DocuPalette;
  kineticStyle?: Partial<KineticNumberStyle>;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const KineticNumber: React.FC<KineticNumberProps> = ({
  label,
  value,
  unit,
  durationFrames: _durationFrames,
  palette,
  kineticStyle,
  enter: _enter,
}) => {
  const theme = paletteToTheme(palette);
  const textColor = theme === "light" ? "#14110d" : "#efe9dc";
  const mutedColor = theme === "light" ? "rgba(20,17,13,0.55)" : "#8a847a";
  const secondaryColor =
    kineticStyle?.labelColor ??
    (theme === "light" ? "rgba(20,17,13,0.68)" : "rgba(239,233,220,0.78)");
  const accent = kineticStyle?.gradientStart ?? PALETTE_MAP[palette].accentColor;
  const display = kineticDisplay(value, unit);

  return (
    <AbsoluteFill>
      <S2vKineticNumber
        num="03"
        name="Kinetic Number"
        meta="Count-Up Stat"
        eyebrow=""
        currency={display.currency}
        target={display.target}
        decimals={display.decimals}
        unit={display.unit}
        label={label}
        source=""
        accent={accent}
        textColor={textColor}
        secondaryColor={secondaryColor}
        mutedColor={mutedColor}
      />
    </AbsoluteFill>
  );
};
