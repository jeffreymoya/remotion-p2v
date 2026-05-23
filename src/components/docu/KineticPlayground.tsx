import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { KineticNumber } from "./KineticNumber";
import { HeadlineCard } from "./HeadlineCard";
import { BLOOMBERG_ORANGE, BLOOMBERG_YELLOW } from "./docu-tokens";

const fontWeightEnum = z.enum([
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
]);

const unitEnum = z.enum(["$", "%", "x", "T", "B"]);

export const kineticPlaygroundSchema = z.object({
  componentType: z.enum(["kinetic-number", "headline-card"]).default("kinetic-number"),
  demoLabel: z.string().default("Market Cap"),
  demoValue: z.number().default(4200000000000),
  demoUnit: unitEnum.default("T"),
  demoHeadline: z.string().default("Breaking News"),
  demoSource: z.string().default("Source: Bloomberg"),
  labelFontSize: z.number().min(8).max(120).default(28),
  labelFontWeight: fontWeightEnum.default("300"),
  labelColor: zColor().default("#94a3b8"),
  labelMarginBottom: z.number().min(0).max(100).default(16),
  valueFontSize: z.number().min(8).max(240).default(96),
  valueFontWeight: fontWeightEnum.default("900"),
  gradientStart: zColor().default(BLOOMBERG_ORANGE),
  gradientEnd: zColor().default(BLOOMBERG_YELLOW),
  positionLeftPct: z.number().min(0).max(100).default(50),
  positionTopPct: z.number().min(0).max(100).default(40),
  headlineFontSize: z.number().min(8).max(120).default(42),
  headlineFontWeight: fontWeightEnum.default("900"),
  headlineColor: zColor().default(BLOOMBERG_ORANGE),
  sourceFontSize: z.number().min(8).max(60).default(20),
  sourceFontWeight: fontWeightEnum.default("300"),
  sourceColor: zColor().default("#94a3b8"),
  accentBarColor: zColor().default(BLOOMBERG_ORANGE),
  bottomOffset: z.number().min(0).max(500).default(80),
  leftOffset: z.number().min(0).max(500).default(80),
});

export type KineticPlaygroundProps = z.infer<typeof kineticPlaygroundSchema>;

export const KineticPlayground: React.FC<KineticPlaygroundProps> = (props) => {
  const delta = Math.random() * 5000000000;
  const value = props.demoValue + delta;

  if (props.componentType === "headline-card") {
    return (
      <AbsoluteFill style={{ background: "#111" }}>
        <HeadlineCard
          text={props.demoHeadline}
          source={props.demoSource}
          palette="cool-tech"
          durationInFrames={90}
          headlineStyle={{
            headlineFontSize: props.headlineFontSize,
            headlineFontWeight: props.headlineFontWeight,
            headlineColor: props.headlineColor,
            sourceFontSize: props.sourceFontSize,
            sourceFontWeight: props.sourceFontWeight,
            sourceColor: props.sourceColor,
            accentBarColor: props.accentBarColor,
            bottomOffset: props.bottomOffset,
            leftOffset: props.leftOffset,
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <KineticNumber
        label={props.demoLabel}
        value={value}
        unit={props.demoUnit}
        durationFrames={90}
        palette="cool-tech"
        kineticStyle={{
          labelFontSize: props.labelFontSize,
          labelFontWeight: props.labelFontWeight,
          labelColor: props.labelColor,
          labelMarginBottom: props.labelMarginBottom,
          valueFontSize: props.valueFontSize,
          valueFontWeight: props.valueFontWeight,
          gradientStart: props.gradientStart,
          gradientEnd: props.gradientEnd,
          positionLeftPct: props.positionLeftPct,
          positionTopPct: props.positionTopPct,
        }}
      />
    </AbsoluteFill>
  );
};
