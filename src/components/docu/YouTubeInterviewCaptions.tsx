import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { InterviewCaptionWord } from "../../lib/docu/youtube-pipeline";

interface YouTubeInterviewCaptionsProps {
  words: InterviewCaptionWord[];
  fps: number;
}

export const YouTubeInterviewCaptions: React.FC<YouTubeInterviewCaptionsProps> = ({
  words,
  fps,
}) => {
  const frame = useCurrentFrame();

  if (!words || words.length === 0) return null;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        pointerEvents: "none",
        paddingBottom: "22%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "80%",
          gap: "0.28em",
          fontFamily: "Barlow Condensed, sans-serif",
          fontWeight: 600,
          fontSize: 48,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {words.map((w, idx) => {
          const frameStart = Math.round((w.startMs / 1000) * fps);
          const staggerDelay = w.wordIndexInEvent * 2;
          const appearFrame = frameStart + staggerDelay;
          const opacity = interpolate(
            frame - appearFrame,
            [0, 4],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const isMatch = w.isMatch;

          const scale = isMatch
            ? interpolate(
                frame - appearFrame,
                [0, 6],
                [0.95, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )
            : 1;

          const color = isMatch
            ? "#F97316"
            : "rgba(255,255,255,0.85)";

          const wordStyle: React.CSSProperties = {
            opacity,
            color,
            transform: isMatch ? `scale(${scale})` : undefined,
            textShadow: "0 2px 6px rgba(0,0,0,0.65)",
            whiteSpace: "pre",
          };

          return (
            <span key={idx} style={wordStyle}>
              {w.word}
              {idx < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
