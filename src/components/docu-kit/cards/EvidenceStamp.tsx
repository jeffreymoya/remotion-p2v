import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { Stamp } from "../anim/Stamp";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, WEIGHT } from "../utils/tokens";

const docLine = z.object({ label: z.string().optional(), text: z.string() });

export const evidenceStampSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  docTitle: z.string(),
  docMeta: z.string(),
  lines: z.array(docLine),
  stampTitle: z.string(),
  stampSub: z.string(),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type EvidenceStampProps = z.infer<typeof evidenceStampSchema>;

export const evidenceStampDefaults: EvidenceStampProps = {
  num: "10",
  name: "Evidence Stamp",
  meta: "Court Exhibit",
  docTitle: "UNITED STATES v. REINHARDT et al.",
  docMeta: "Case 24-CR-0418 · S.D.N.Y. · Filed 04.18.2025",
  lines: [
    { label: "COUNT 1.", text: "Wire fraud in violation of 18 U.S.C. § 1343, occurring between 14 March 2021 and 09 June 2024." },
    { label: "COUNT 2.", text: "Conspiracy to commit money laundering, 18 U.S.C. § 1956(h), involving funds in excess of $1.8 billion routed through Aegis Holdings (Cayman)." },
    { label: "COUNT 3.", text: "Securities fraud, 15 U.S.C. § 78j(b), via material misstatements in quarterly filings 2Q21 – 4Q23." },
    { label: "EXHIBIT A.", text: "Internal wire authorization signed by R. Kade, time-stamped 02:14 AM, 11 February 2023." },
  ],
  stampTitle: "Exhibit A",
  stampSub: "Filed Under Seal",
  accent: COLORS.red,
  textColor: COLORS.ink,
  secondaryColor: "rgba(20,17,13,0.78)",
  mutedColor: "rgba(20,17,13,0.6)",
};

export const EvidenceStamp: React.FC<EvidenceStampProps> = (props) => {
  const p = { ...evidenceStampDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const lineStyle = (index: number): React.CSSProperties => {
    const start = 4 + index * 4;
    const progress = interpolate(frame, [start, start + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: resolveEasing(EasingPreset.CubicOut),
    });
    return {
      opacity: progress * fade,
      transform: `translateY(${(1 - progress) * 20}px)`,
    };
  };

  return (
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} theme="light" accent={COLORS.red} />

      <div
        style={{
          position: "absolute",
          inset: "170px 180px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          fontFamily: FONT.mono,
          fontSize: 26,
          lineHeight: 1.65,
          color: p.secondaryColor,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: `1.5px solid ${p.textColor}`,
            paddingBottom: 12,
            marginBottom: 20,
            ...lineStyle(0),
          }}
        >
          <div style={{ fontSize: 28, fontWeight: WEIGHT.bold, letterSpacing: "0.22em", textTransform: "uppercase", color: p.textColor }}>
            {p.docTitle}
          </div>
          <div style={{ fontSize: 24, fontWeight: WEIGHT.medium, letterSpacing: "0.22em", textTransform: "uppercase", color: p.mutedColor }}>
            {p.docMeta}
          </div>
        </div>

        {p.lines.map((line, i) => (
          <p key={i} style={{ margin: 0, ...lineStyle(i + 1) }}>
            {line.label ? <span style={{ fontWeight: WEIGHT.bold, letterSpacing: "0.05em" }}>{line.label} </span> : null}
            {line.text}
          </p>
        ))}
      </div>

      <Stamp
        startFrame={66}
        durFrames={14}
        fromScale={3.4}
        toScale={1}
        fromRotate={-25}
        toRotate={-8}
        fromBlur={8}
        easing={EasingPreset.Slam}
        exit={exit}
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          marginLeft: -360,
          marginTop: -160,
          width: 720,
          fontFamily: FONT.display,
          fontWeight: WEIGHT.black,
          fontSize: 240,
          lineHeight: 0.92,
          letterSpacing: "0.02em",
          color: COLORS.red,
          border: `14px solid ${COLORS.red}`,
          padding: "32px 60px 24px",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {p.stampTitle}
        <span style={{ display: "block", fontWeight: WEIGHT.bold, fontSize: 60, letterSpacing: "0.32em", marginTop: 10 }}>
          {p.stampSub}
        </span>
      </Stamp>
    </Slide>
  );
};
