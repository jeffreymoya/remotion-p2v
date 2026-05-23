import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { AnimatedText } from "remotion-bits";
import type { DocuPalette, HeadlineCardStyle } from "./docu-tokens";
import {
  DEFAULT_HEADLINE_CARD_STYLE,
  FONT_DISPLAY,
  HEADLINE_ENTER_FRAMES,
  HEADLINE_EXIT_FRAMES,
  TRACKING,
  WEIGHT,
} from "./docu-tokens";

loadInter();
loadBarlowCondensed();

interface HeadlineCardProps {
  text: string;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  headlineStyle?: Partial<HeadlineCardStyle>;
}

export const HeadlineCard: React.FC<HeadlineCardProps> = ({
  text,
  source,
  durationInFrames,
  headlineStyle,
}) => {
  const frame = useCurrentFrame();

  const s = { ...DEFAULT_HEADLINE_CARD_STYLE, ...headlineStyle };

  const enterEnd = HEADLINE_ENTER_FRAMES;
  const exitStart = durationInFrames - HEADLINE_EXIT_FRAMES;

  const translateY = interpolate(
    frame,
    [0, enterEnd, exitStart, durationInFrames],
    [32, 0, 0, -16],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = interpolate(
    frame,
    [0, enterEnd, exitStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const barScaleY = interpolate(
    frame,
    [0, enterEnd],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: s.leftOffset,
        bottom: s.bottomOffset,
        maxWidth: 640,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          paddingLeft: 48,
          paddingTop: 20,
          paddingBottom: 20,
          paddingRight: 32,
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 20,
            width: 3,
            height: "calc(100% - 40px)",
            backgroundColor: s.accentBarColor,
            transform: `scaleY(${barScaleY})`,
            transformOrigin: "top",
            borderRadius: 2,
          }}
        />
        <AnimatedText
          transition={{
            split: "word",
            y: [16, 0],
            opacity: [0, 1],
            splitStagger: 3,
            frames: [0, 24],
            delay: 6,
          }}
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: s.headlineFontWeight,
            fontSize: s.headlineFontSize,
            color: s.headlineColor,
            lineHeight: 1.1,
            letterSpacing: TRACKING.xwide,
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {text}
        </AnimatedText>
        {source ? (
          <div
            style={{
              fontWeight: s.sourceFontWeight,
              fontSize: s.sourceFontSize,
              color: s.sourceColor,
              marginTop: 8,
              lineHeight: 1.35,
              letterSpacing: TRACKING.wide,
            }}
          >
            {source}
          </div>
        ) : null}
      </div>
    </div>
  );
};
