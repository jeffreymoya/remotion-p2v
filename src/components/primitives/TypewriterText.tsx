import React from "react";
import { interpolate } from "remotion";
import { font, palette } from "../tokens";

interface TypewriterTextProps {
  frame: number;
  startFrame: number;
  text: string;
  duration?: number;
  fontSize?: number;
  color?: string;
  showCursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  frame,
  startFrame,
  text,
  duration = 30,
  fontSize = 40,
  color = palette.text,
  showCursor = true,
}) => {
  const charCount = Math.floor(
    interpolate(frame, [startFrame, startFrame + duration], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const visible = text.substring(0, charCount);
  const cursorVisible = showCursor && frame >= startFrame && Math.floor(frame / 15) % 2 === 0;

  return (
    <span
      style={{
        fontFamily: font.body,
        fontSize,
        color,
        whiteSpace: "pre-wrap",
      }}
    >
      {visible}
      {cursorVisible && (
        <span style={{ opacity: 0.8, color: palette.accent }}>|</span>
      )}
    </span>
  );
};
