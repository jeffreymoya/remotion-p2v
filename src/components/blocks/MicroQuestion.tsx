import React from "react";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { TypewriterText } from "../primitives";

interface MicroQuestionProps {
  frameRange: [number, number];
  frame: number;
  question: string;
  questions?: string[];
  style?: "typewriter" | "fade";
}

export const MicroQuestion: React.FC<MicroQuestionProps> = ({
  frameRange,
  frame,
  question,
  questions,
  style: visualStyle = "typewriter",
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;
  const duration = frameRange[1] - start;
  const allQuestions = questions ?? [question];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `radial-gradient(ellipse at center, #2a3b5c, ${palette.bg})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {allQuestions.map((q, i) => {
        const qDuration = Math.floor(duration / allQuestions.length);
        const qStart = i * qDuration;

        if (visualStyle === "typewriter") {
          return (
            <div key={i} style={{ marginBottom: 20, minHeight: 50 }}>
              <TypewriterText
                frame={localFrame}
                startFrame={qStart}
                text={q}
                duration={Math.min(qDuration - 5, 30)}
                fontSize={40}
                color={palette.text}
              />
            </div>
          );
        }

        const fadeOpacity = interpolate(
          localFrame,
          [qStart, qStart + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <div
            key={i}
            style={{
              marginBottom: 20,
              fontSize: 40,
              fontFamily: font.body,
              color: palette.text,
              opacity: fadeOpacity,
            }}
          >
            {q}
          </div>
        );
      })}
    </div>
  );
};
