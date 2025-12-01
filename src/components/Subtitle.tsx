import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Word } from "./Word";
import { TextElement } from "../lib/types";
import { msToFrame } from "../lib/utils";

interface SubtitleProps {
  textElement: TextElement;
}

const Subtitle: React.FC<SubtitleProps> = ({ textElement }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Backward compatibility: check if words array exists
  const hasWords = textElement.words && textElement.words.length > 0;

  if (hasWords) {
    const words = textElement.words!;

    // Use holdFrames from text element, fallback to 6
    const holdFrames = textElement.holdFrames ?? 6;

    // Get sentence end time from last word
    const lastWord = words[words.length - 1];
    const sentenceEndFrame = lastWord.endFrame ?? msToFrame(lastWord.endMs, fps);

    // Hide entire sentence if it has ended
    const sentenceHasEnded = frame > sentenceEndFrame + holdFrames;
    if (sentenceHasEnded) {
      return null;
    }

    // Cumulative word rendering - words appear progressively, disappear together
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 350,
            height: 150,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          {words.map((word, idx) => {
            const start = word.startFrame ?? msToFrame(word.startMs, fps);

            // Word visible if it has started (sentence end check above)
            const wordHasStarted = frame >= start;
            if (!wordHasStarted) {
              return null;
            }

            return (
              <Word
                key={idx}
                text={word.text}
                startFrame={start}
                currentFrame={frame}
                emphasis={word.emphasis || { level: "none" }}
                fps={fps}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    );
  }

  // Legacy phrase rendering fallback
  const enter = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: 5,
  });

  // Legacy Word component interface (old props)
  const LegacyWord: React.FC<{
    enterProgress: number;
    text: string;
    stroke: boolean;
  }> = ({ enterProgress, text, stroke }) => {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 350,
          height: 150,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 120,
            color: "white",
            WebkitTextStroke: stroke ? "20px black" : undefined,
            transform: `scale(${enterProgress}) translateY(${(1 - enterProgress) * 50}px)`,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {text}
        </span>
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <LegacyWord stroke enterProgress={enter} text={textElement.text} />
      </AbsoluteFill>
      <AbsoluteFill>
        <LegacyWord enterProgress={enter} text={textElement.text} stroke={false} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Subtitle;
