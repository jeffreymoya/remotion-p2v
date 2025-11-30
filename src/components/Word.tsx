import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import videoConfig from "../../config/video.config.json";
import { bebasNeue, breeSerif } from "../lib/fonts";

interface WordProps {
  text: string;
  startFrame: number;
  endFrame: number;
  currentFrame: number;
  emphasis: { level: "none" | "med" | "high"; tone?: string };
  fps: number;
}

/**
 * Map config font names to loaded Google Fonts
 */
function getFontFamily(configFontName: string): string {
  const fontMap: Record<string, string> = {
    "Bebas Neue": bebasNeue.fontFamily,
    "Bree Serif": breeSerif.fontFamily,
  };
  return fontMap[configFontName] || configFontName;
}

/**
 * Get emphasis styling configuration based on the emphasis level
 */
function getEmphasisStyle(level: "none" | "med" | "high") {
  const emphasisConfig = videoConfig.emphasis;
  return emphasisConfig[level];
}

export const Word: React.FC<WordProps> = ({
  text,
  startFrame,
  endFrame,
  currentFrame,
  emphasis,
  fps,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Only show word when it's within its time range
  const isVisible = currentFrame >= startFrame && currentFrame < endFrame;

  if (!isVisible) {
    return null;
  }

  // Calculate frames since word started appearing
  const framesSinceStart = currentFrame - startFrame;

  // Get emphasis styling
  const emphasisStyle = getEmphasisStyle(emphasis.level);

  // Animation configuration from video.config.json
  const animConfig = videoConfig.animations.text;
  const animationDurationMs = animConfig.durationMs; // 200ms
  const animationDurationFrames = (animationDurationMs / 1000) * fps;

  // Spring animation for pop effect
  const popProgress = spring({
    frame: framesSinceStart,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: animationDurationFrames,
  });

  // Scale animation: 0.8 -> 1.0
  const scale = interpolate(
    popProgress,
    [0, 1],
    [animConfig.scaleFrom, animConfig.scaleTo]
  );

  // Y offset animation: 10px -> 0px
  const yOffset = interpolate(popProgress, [0, 1], [10, 0]);

  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: getFontFamily(emphasisStyle.fontFamily),
        fontSize: emphasisStyle.fontSize,
        color: emphasisStyle.color,
        fontWeight: emphasisStyle.fontWeight,
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transformOrigin: "center center",
      }}
    >
      {text}
    </span>
  );
};
