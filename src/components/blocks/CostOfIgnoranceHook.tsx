import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { noise2D } from "@remotion/noise";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("CostOfIgnoranceHook"),
  frameRange: FrameRange,
  cost: z.string(),
  who: z.string().optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "CostOfIgnoranceHook",
  role: "hook",
  guidelineSection: "§1 Hook — Cost of Ignorance",
  whenToUse: "Opening that quantifies what the audience loses by not knowing this. Best when there's a concrete cost — money, time, opportunity.",
  effect: "Alarming headline slams in with a decaying horizontal shake. 'Who' label fades in below.",
  props: {
    cost: "string: The cost or consequence headline",
    who: "string?: Optional label identifying who bears the cost",
  },
};

interface CostOfIgnoranceHookProps {
  frameRange: [number, number];
  frame: number;
  cost: string;
  who?: string;
}

export const CostOfIgnoranceHook: React.FC<CostOfIgnoranceHookProps> = ({
  frameRange,
  frame,
  cost,
  who,
}) => {
  const localFrame = frame;

  const textOpacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shakeAmplitude = interpolate(localFrame, [0, 30], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = localFrame < 30
    ? noise2D("shake-x", localFrame * 0.15, 0) * shakeAmplitude
    : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: palette.bg,
        background: `radial-gradient(ellipse at center, ${palette.negative}22, ${palette.bg})`,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: "bold",
          fontFamily: font.display,
          color: palette.text,
          textAlign: "center",
          maxWidth: "80%",
          opacity: textOpacity,
          transform: `translateX(${shake}px)`,
        }}
      >
        {cost}
      </div>
      {who && (
        <div
          style={{
            marginTop: 30,
            fontSize: 32,
            color: palette.muted,
            fontFamily: font.body,
            opacity: textOpacity,
          }}
        >
          {who}
        </div>
      )}
    </div>
  );
};

export { CostOfIgnoranceHook as Component };
