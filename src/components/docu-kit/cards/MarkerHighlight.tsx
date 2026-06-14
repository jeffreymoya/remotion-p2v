import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { Reveal } from "../anim/Reveal";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";

const headlineSegment = z.object({
  text: z.string(),
  highlight: z.enum(["mark", "strike"]).optional(),
});

export const markerHighlightSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  paper: z.string(),
  byline: z.string(),
  headline: z.array(headlineSegment),
  sub: z.string(),
  markColor: zColor(),
  strikeColor: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type MarkerHighlightProps = z.infer<typeof markerHighlightSchema>;

export const markerHighlightDefaults: MarkerHighlightProps = {
  num: "05",
  name: "Marker Highlight",
  meta: "Headline Scan",
  paper: "The Financial Record",
  byline: "Vol. CXLII · Tuesday, March 14, 2023 · Edition A1",
  headline: [
    { text: "Helix Capital files for" },
    { text: "bankruptcy", highlight: "mark" },
    { text: "amid probe into" },
    { text: "$2.4B", highlight: "mark" },
    { text: "in" },
    { text: "missing client funds.", highlight: "strike" },
  ],
  sub: "Regulators say transfers to an offshore shell predate the bank's collapse by at least nineteen months.",
  markColor: COLORS.yellow,
  strikeColor: COLORS.red,
  textColor: COLORS.ink,
  secondaryColor: "rgba(20,17,13,0.72)",
  mutedColor: "rgba(20,17,13,0.6)",
};

export const MarkerHighlight: React.FC<MarkerHighlightProps> = (props) => {
  const p = { ...markerHighlightDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const mastheadOpacity =
    interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const subOpacity =
    interpolate(frame, [105, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  let wordIndex = 0;
  let markIndex = 0;
  const wordEl = (word: string, key: string): React.ReactNode => {
    const start = 6 + wordIndex * 1.4;
    wordIndex += 1;
    const progress = interpolate(frame, [start, start + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: resolveEasing(EasingPreset.CubicOut),
    });
    return (
      <span
        key={key}
        style={{
          display: "inline-block",
          opacity: progress * fade,
          transform: `translateY(${(1 - progress) * 20}px)`,
        }}
      >
        {word}
      </span>
    );
  };

  const nodes: React.ReactNode[] = [];
  p.headline.forEach((seg, si) => {
    const words = seg.text.split(/\s+/).filter((w) => w.length > 0);
    const inner = words.map((w, wi) => (
      <React.Fragment key={`${si}-${wi}`}>
        {wordEl(w, `w-${si}-${wi}`)}
        {wi < words.length - 1 ? " " : null}
      </React.Fragment>
    ));
    if (seg.highlight) {
      const start = 48 + markIndex * 21;
      markIndex += 1;
      nodes.push(
        <Reveal
          key={`h-${si}`}
          variant={seg.highlight === "strike" ? "strike" : "highlight"}
          color={seg.highlight === "strike" ? p.strikeColor : p.markColor}
          startFrame={start}
          durFrames={24}
          easing={EasingPreset.Swipe}
          exit={exit}
        >
          {inner}
        </Reveal>,
      );
    } else {
      nodes.push(<React.Fragment key={`s-${si}`}>{inner}</React.Fragment>);
    }
    nodes.push(" ");
  });

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} theme="light" accent={COLORS.red} />

      <div style={{ position: "absolute", inset: 0, padding: "180px 180px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: `2px solid ${p.textColor}`,
            paddingBottom: 18,
            marginBottom: 56,
            opacity: mastheadOpacity,
          }}
        >
          <div style={{ fontFamily: FONT.serif, fontSize: 32, fontWeight: WEIGHT.bold, fontStyle: "italic" }}>
            {p.paper}
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: TYPE_SCALE.xs,
              fontWeight: WEIGHT.medium,
              letterSpacing: TRACKING.label,
              textTransform: "uppercase",
              color: p.mutedColor,
            }}
          >
            {p.byline}
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: WEIGHT.extraBold,
            fontSize: TYPE_SCALE["3xl"],
            lineHeight: 1.02,
            letterSpacing: "-0.015em",
            color: p.textColor,
            maxWidth: 1580,
          }}
        >
          {nodes}
        </div>

        <div
          style={{
            marginTop: 56,
            fontFamily: FONT.display,
            fontWeight: WEIGHT.medium,
            fontSize: 44,
            lineHeight: 1.25,
            color: p.secondaryColor,
            maxWidth: 1400,
            opacity: subOpacity,
          }}
        >
          {p.sub}
        </div>
      </div>
    </Slide>
  );
};
