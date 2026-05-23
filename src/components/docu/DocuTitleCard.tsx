import React from "react";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { AnimatedText } from "remotion-bits";
import {
  BLOOMBERG_ORANGE,
  FONT_DISPLAY,
  LEADING,
  TRACKING,
  TYPE_SCALE,
  WEIGHT,
} from "./docu-tokens";

loadInter();
loadBarlowCondensed();

interface DocuTitleCardProps {
  title: string;
  subtitle: string;
  durationInFrames: number;
}

export const DocuTitleCard: React.FC<DocuTitleCardProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#00000088",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          paddingLeft: 120,
          borderLeft: `3px solid ${BLOOMBERG_ORANGE}`,
          marginLeft: 120,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <AnimatedText
            transition={{
              split: "word",
              y: [20, 0],
              opacity: [0, 1],
              splitStagger: 4,
              frames: [0, 20],
            }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: TYPE_SCALE["3xl"],
              fontWeight: WEIGHT.extraBold,
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: TRACKING.xwide,
              lineHeight: LEADING.none,
              textShadow: "0 4px 16px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </AnimatedText>
        </div>

        <div>
          <AnimatedText
            transition={{
              split: "word",
              y: [40, 0],
              blur: [10, 0],
              opacity: [0, 1],
              splitStagger: 2,
              delay: 24,
            }}
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: TYPE_SCALE.xl,
              fontWeight: WEIGHT.semiBold,
              color: BLOOMBERG_ORANGE,
              lineHeight: LEADING.tight,
              textShadow: "0 2px 8px rgba(0,0,0,0.7)",
            }}
          >
            {subtitle}
          </AnimatedText>
        </div>
      </div>
    </div>
  );
};
