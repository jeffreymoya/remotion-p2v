import type React from "react";
import { interpolate, spring } from "remotion";
import videoConfig from "../../config/video.config.json";
import { montserrat, roboto } from "../lib/fonts";

interface WordProps {
  text: string;
  startFrame: number;
  currentFrame: number;
  emphasis: { level: "none" | "med" | "high"; tone?: string };
  fps: number;
}

/**
 * Map config font names to loaded Google Fonts
 */
function getFontFamily(configFontName: string): string {
  const fontMap: Record<string, string> = {
    "Montserrat": montserrat.fontFamily,
    "Roboto": roboto.fontFamily,
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

/**
 * Generate text outline using text-shadow for better visibility
 */
function getTextOutline(strokeColor: string, strokeWidth: number): string {
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  return offsets
    .map(([x, y]) => `${x * strokeWidth}px ${y * strokeWidth}px 0px ${strokeColor}`)
    .join(", ");
}

export const Word: React.FC<WordProps> = ({
  text,
  startFrame,
  currentFrame,
  emphasis,
  fps,
}) => {
  // Show the word once it has started and keep it on-screen for the rest of the line
  const isVisible = currentFrame >= startFrame;

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

  // Snap-highlight animation (faster spring for snappy effect)
  const hasHighlight = emphasis.level === "med" || emphasis.level === "high";
  const highlightDurationFrames = Math.floor(animationDurationFrames * 0.6);

  const highlightProgress = spring({
    frame: framesSinceStart,
    fps,
    config: { damping: 300, stiffness: 400 },
    durationInFrames: highlightDurationFrames,
  });

  const highlightScaleX = hasHighlight
    ? interpolate(highlightProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        transformOrigin: "center center",
      }}
    >
      {/* Yellow highlight background */}
      {hasHighlight && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: "-4px",
            right: "-4px",
            bottom: 0,
            backgroundColor: "#F2E205",
            transform: `scaleX(${highlightScaleX})`,
            transformOrigin: "left center",
            zIndex: -1,
            borderRadius: "2px",
          }}
        />
      )}

      {/* Text with outline */}
      <span
        style={{
          fontFamily: getFontFamily(emphasisStyle.fontFamily),
          fontSize: emphasisStyle.fontSize,
          color: emphasisStyle.color,
          fontWeight: emphasisStyle.fontWeight,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          textShadow: getTextOutline("#1A1A1D", 2),
          position: "relative",
          zIndex: 1,
          padding: "0 4px",
        }}
      >
        {text}
      </span>
    </span>
  );
};
