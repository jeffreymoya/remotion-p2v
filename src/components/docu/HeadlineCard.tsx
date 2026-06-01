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
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey, ExitPresetKey } from "../../lib/docu/overlays/overlay-animations";

loadInter();
loadBarlowCondensed();

interface HeadlineCardProps {
  text: string;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  headlineStyle?: Partial<HeadlineCardStyle>;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
  exit?: ExitPresetKey;
  exitParams?: Record<string, number>;
}

export const HeadlineCard: React.FC<HeadlineCardProps> = ({
  text,
  source,
  durationInFrames,
  headlineStyle,
  enter,
  exit,
}) => {
  const frame = useCurrentFrame();

  const s = { ...DEFAULT_HEADLINE_CARD_STYLE, ...headlineStyle };

  const enterEnd = HEADLINE_ENTER_FRAMES;
  const exitStart = durationInFrames - HEADLINE_EXIT_FRAMES;

  let opacity: number;
  let transform: string;

  const exitDur = HEADLINE_EXIT_FRAMES;
  const inExit = frame >= exitStart;

  if (exit && inExit) {
    const exitPreset = getEnterPreset(exit);
    const exitStyle: React.CSSProperties = exitPreset.channel === "style"
      ? exitPreset.fn(frame, exitStart, 0, exitDur)
      : {};
    opacity = Number(exitStyle.opacity) || 0;
    transform = exitStyle.transform ?? "none";
  } else if (enter) {
    const enterPreset = getEnterPreset(enter);
    const enterStyle: React.CSSProperties = enterPreset.channel === "style"
      ? enterPreset.fn(frame, 0, 0, enterEnd)
      : {};

    if (inExit) {
      const exitY = interpolate(frame, [exitStart, durationInFrames], [0, -16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const exitOpacityVal = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      opacity = exitOpacityVal;
      transform = `translateY(${exitY}px)`;
    } else {
      opacity = Number(enterStyle.opacity) || 1;
      transform = enterStyle.transform ?? "none";
    }
  } else {
    const translateY = interpolate(
      frame,
      [0, enterEnd, exitStart, durationInFrames],
      [32, 0, 0, -16],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    opacity = interpolate(
      frame,
      [0, enterEnd, exitStart, durationInFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    transform = `translateY(${translateY}px)`;
  }

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
        transform,
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
