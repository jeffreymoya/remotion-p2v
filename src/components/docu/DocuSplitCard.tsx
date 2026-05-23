import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { AnimatedText } from "remotion-bits";
import type { DocuPalette } from "./docu-tokens";
import {
  BLOOMBERG_ORANGE,
  FONT_BODY,
  FONT_DISPLAY,
  LEADING,
  PALETTE_MAP,
  TRACKING,
  TYPE_SCALE,
  WEIGHT,
} from "./docu-tokens";
import { DocuKenBurns } from "./DocuKenBurns";

loadInter();
loadBarlowCondensed();

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
  durationInFrames,
}) => {
  const paletteColors = PALETTE_MAP[palette];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
      }}
    >
      <div style={{ flex: "0 0 50%", overflow: "hidden" }}>
        <DocuKenBurns durationInFrames={durationInFrames} shotIndex={0}>
          <Img
            src={staticFile(imagePath)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </DocuKenBurns>
      </div>

      <div
        style={{
          flex: "0 0 50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 60px",
          paddingLeft: 84,
          background: palette === "cool-tech"
            ? "linear-gradient(to right, rgba(0,20,60,0.55), rgba(0,10,30,0.45))"
            : "linear-gradient(to right, rgba(30,10,0,0.55), rgba(10,5,0,0.45))",
          borderLeft: `3px solid ${paletteColors.accentColor}`,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <AnimatedText
            transition={{
              x: [-30, 0],
              opacity: [0, 1],
              easing: "easeOutQuart",
            }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: TYPE_SCALE.lg,
              fontWeight: WEIGHT.bold,
              color: BLOOMBERG_ORANGE,
              letterSpacing: TRACKING.xwide,
              lineHeight: LEADING.tight,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {institution}
          </AnimatedText>
        </div>

        <div style={{ marginBottom: 28 }}>
          <AnimatedText
            transition={{
              split: "word",
              y: [20, 0],
              blur: [8, 0],
              opacity: [0, 1],
              splitStagger: 2,
              delay: 10,
            }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: TYPE_SCALE.md,
              fontWeight: WEIGHT.medium,
              color: "#ffffff",
              lineHeight: LEADING.snug,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {headline}
          </AnimatedText>
        </div>

        {cite ? (
          <div>
            <AnimatedText
              transition={{
                opacity: [0, 1],
                delay: 20,
              }}
              style={{
                fontFamily: FONT_BODY,
                fontSize: TYPE_SCALE.xs,
                fontWeight: WEIGHT.light,
                color: "#B0B0B0",
                letterSpacing: TRACKING.wide,
                lineHeight: 1.3,
              }}
            >
              {cite}
            </AnimatedText>
          </div>
        ) : null}
      </div>
    </div>
  );
};
