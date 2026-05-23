import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { AnimatedText, StaggeredMotion } from "remotion-bits";
import {
  BLOOMBERG_ORANGE,
  FONT_BODY,
  TRACKING,
  TYPE_SCALE,
  WEIGHT,
} from "./docu-tokens";

loadFont();

interface DocuContextBarProps {
  cycleItems: string[];
  durationInFrames: number;
}

export const DocuContextBar: React.FC<DocuContextBarProps> = ({
  cycleItems,
}) => {
  return (
    <StaggeredMotion
      transition={{
        y: [80, 0],
        opacity: [0, 1],
        duration: 12,
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "#111111DD",
          borderLeft: `4px solid ${BLOOMBERG_ORANGE}`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          paddingRight: 24,
          backdropFilter: "blur(6px)",
        }}
      >
        <AnimatedText
          transition={{
            cycle: {
              texts: cycleItems,
              itemDuration: 90,
            },
          }}
          style={{
            fontFamily: FONT_BODY,
            fontSize: TYPE_SCALE.sm,
            fontWeight: WEIGHT.medium,
            color: "#e2e8f0",
            letterSpacing: TRACKING.wide,
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </StaggeredMotion>
  );
};
