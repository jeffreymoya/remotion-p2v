import React from "react";
import { spring, interpolate } from "remotion";
import { palette, font, easing } from "../tokens";

interface PromiseCardProps {
  frameRange: [number, number];
  frame: number;
  promise: string;
  bullets?: string[];
}

export const PromiseCard: React.FC<PromiseCardProps> = ({
  frameRange,
  frame,
  promise,
  bullets,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

  const slideUp = spring({
    frame: localFrame,
    fps: 30,
    from: 200,
    to: 0,
    config: { damping: 15, stiffness: 100 },
  });

  const cardOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headingOpacity = interpolate(localFrame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${palette.accent}33, ${palette.bg})`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 900,
          padding: 50,
          borderRadius: 30,
          backgroundColor: palette.card,
          border: `1px solid ${palette.border}`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          transform: `translateY(${slideUp}px)`,
          opacity: cardOpacity,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            opacity: headingOpacity,
            fontSize: 42,
            fontWeight: "bold",
            fontFamily: font.display,
            color: palette.text,
            marginBottom: 30,
          }}
        >
          {promise}
        </div>
        {bullets?.map((bullet, i) => {
          const bulletOpacity = interpolate(
            localFrame,
            [40 + i * 15, 55 + i * 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                opacity: bulletOpacity,
                fontSize: 32,
                color: palette.muted,
                fontFamily: font.body,
                marginBottom: 20,
              }}
            >
              {bullet}
            </div>
          );
        })}
      </div>
    </div>
  );
};
