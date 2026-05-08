import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

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
  const [start] = frameRange;
  const localFrame = frame - start;
  const duration = frameRange[1] - start;

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
