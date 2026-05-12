import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { TypewriterText } from "../primitives";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("MicroQuestion"),
  frameRange: FrameRange,
  question: z.string(),
  questions: z.array(z.string()).optional(),
  style: z.enum(["typewriter", "fade"]).default("typewriter"),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "MicroQuestion",
  role: "retention",
  guidelineSection: "§4 Retention — Micro Question",
  whenToUse: "Poses one or more rhetorical questions to maintain engagement. Use mid-segment to reset attention.",
  effect: "Questions appear sequentially. Typewriter style reveals character-by-character; fade style uses opacity cross-fade.",
  props: {
    question: "string: Primary question",
    questions: "string[]?: Additional questions shown sequentially",
    style: '"typewriter"|"fade": Reveal style (default: typewriter)',
  },
};

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
  const localFrame = frame;
  const duration = frameRange[1] - frameRange[0];
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

export { MicroQuestion as Component };
