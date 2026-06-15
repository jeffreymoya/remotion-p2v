import React from "react";
import { AbsoluteFill } from "remotion";
import { SplitCard } from "./scenes/SplitCard";
import type { DocuPalette } from "./docu-tokens";
import { paletteToAccent, paletteToTheme, toStaticSrc } from "./s2v-adapters";

interface DocuSplitCardProps {
  imagePath: string;
  institution: string;
  headline: string;
  cite?: string;
  palette: DocuPalette;
  durationInFrames: number;
}

export const DocuSplitCard: React.FC<DocuSplitCardProps> = ({
  imagePath,
  institution,
  headline,
  cite,
  palette,
  durationInFrames: _durationInFrames,
}) => {
  return (
    <AbsoluteFill>
      <SplitCard
        imageSrc={toStaticSrc(imagePath)}
        institution={institution}
        headline={headline}
        cite={cite}
        theme={paletteToTheme(palette)}
        accent={paletteToAccent(palette)}
        shotIndex={0}
        panelScrim={
          palette === "cool-tech"
            ? "linear-gradient(to right, rgba(11,11,13,0.55), rgba(11,11,13,0.35))"
            : "linear-gradient(to right, rgba(236,228,208,0.72), rgba(236,228,208,0.52))"
        }
      />
    </AbsoluteFill>
  );
};
