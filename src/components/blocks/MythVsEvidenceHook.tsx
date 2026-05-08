import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";

interface MythVsEvidenceHookProps {
  frameRange: [number, number];
  frame: number;
  myth: string;
  evidence: string;
}

export const MythVsEvidenceHook: React.FC<MythVsEvidenceHookProps> = ({
  frameRange,
  frame,
  myth,
  evidence,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;
  const midPoint = Math.floor((frameRange[1] - start) / 2);

  const mythOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const evidenceOpacity = interpolate(localFrame, [midPoint, midPoint + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: palette.bg,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
          opacity: mythOpacity,
        }}
      >
        <div style={{ fontSize: 48, color: palette.negative, marginBottom: 20 }}>✗</div>
        <div style={{ fontSize: 36, fontFamily: font.body, color: palette.text, textAlign: "center" }}>
          {myth}
        </div>
      </div>
      <div style={{ width: 2, backgroundColor: palette.border }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
          opacity: evidenceOpacity,
        }}
      >
        <div style={{ fontSize: 48, color: palette.positive, marginBottom: 20 }}>✓</div>
        <div style={{ fontSize: 36, fontFamily: font.body, color: palette.text, textAlign: "center" }}>
          {evidence}
        </div>
      </div>
    </div>
  );
};
