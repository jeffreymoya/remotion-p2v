import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("ComparisonSplit"),
  frameRange: FrameRange,
  leftLabel: z.string(),
  rightLabel: z.string(),
  rows: z.array(z.object({ label: z.string(), left: z.string(), right: z.string() })),
  verdict: z.string().optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "ComparisonSplit",
  role: "visual",
  guidelineSection: "§3 Visual — Comparison",
  whenToUse: "Side-by-side comparison of two approaches, tools, or time periods.",
  effect: "Column headers fade in; rows reveal staggered. Verdict line slides in at the end in accent color.",
  props: {
    leftLabel: "string: Left column header",
    rightLabel: "string: Right column header",
    rows: "{label: string, left: string, right: string}[]: Comparison rows",
    verdict: "string?: Final summary line",
  },
};

interface ComparisonRow {
  label: string;
  left: string;
  right: string;
}

interface ComparisonSplitProps {
  frameRange: [number, number];
  frame: number;
  leftLabel: string;
  rightLabel: string;
  rows: ComparisonRow[];
  verdict?: string;
}

export const ComparisonSplit: React.FC<ComparisonSplitProps> = ({
  frameRange,
  frame,
  leftLabel,
  rightLabel,
  rows,
  verdict,
}) => {
  const localFrame = frame;
  const duration = frameRange[1] - frameRange[0];

  const headerOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: palette.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 1200,
          marginBottom: 40,
          opacity: headerOpacity,
        }}
      >
        <div style={{ flex: 1, fontSize: 36, fontWeight: "bold", fontFamily: font.display, color: palette.negative, textAlign: "center" }}>
          {leftLabel}
        </div>
        <div style={{ flex: 1, fontSize: 36, fontWeight: "bold", fontFamily: font.display, color: palette.positive, textAlign: "center" }}>
          {rightLabel}
        </div>
      </div>
      {rows.map((row, i) => {
        const rowOpacity = interpolate(localFrame, [20 + i * 15, 35 + i * 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              width: "100%",
              maxWidth: 1200,
              marginBottom: 20,
              opacity: rowOpacity,
            }}
          >
            <div style={{ flex: 1, fontSize: 28, fontFamily: font.body, color: palette.text, textAlign: "center" }}>
              {row.left}
            </div>
            <div style={{ fontSize: 24, color: palette.muted, padding: "0 20px", fontFamily: font.body }}>
              {row.label}
            </div>
            <div style={{ flex: 1, fontSize: 28, fontFamily: font.body, color: palette.text, textAlign: "center" }}>
              {row.right}
            </div>
          </div>
        );
      })}
      {verdict && (
        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            fontWeight: "bold",
            fontFamily: font.display,
            color: palette.accent,
            opacity: interpolate(localFrame, [duration - 30, duration - 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {verdict}
        </div>
      )}
    </div>
  );
};

export { ComparisonSplit as Component };
