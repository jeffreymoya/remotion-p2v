import { ViewportKeyframe } from "@/src/lib/storyflow/types";

export type AspectRatio = "16:9" | "9:16";

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "slowDramatic"
  | "fastAction";

export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
  emphasis?: {
    level: "none" | "med" | "high";
    tone?: "warm" | "intense";
  };
}

export interface ViewportAnimation {
  enabled: boolean;
  keyframes: ViewportKeyframe[];
  imageWidth?: number;
  imageHeight?: number;
}

export interface BackgroundElement {
  imageUrl?: string;
  videoUrl?: string;
  startFrame: number;
  endFrame: number;
  enterTransition: "fade" | "blur" | "none";
  exitTransition: "fade" | "blur" | "none";
  mediaMetadata?: { width?: number; height?: number; duration?: number; mode?: string };
  viewportAnimation?: ViewportAnimation;
}

export interface TextElement {
  text: string;
  position: "top" | "bottom" | "center";
  startFrame: number;
  endFrame: number;
  words: WordTiming[];
  holdFrames?: number;
}

export interface AudioElement {
  audioUrl: string;
  startFrame: number;
  endFrame: number;
}

export interface MusicDuckingConfig {
  /**
   * Percentage drop applied while narration is active.
   * Example: 0.4 => music plays at 60% of its base volume.
   */
  reduction: number;
  /** Frames to ramp down into the ducked volume. */
  attackFrames: number;
  /** Frames to ramp back up after narration ends. */
  releaseFrames: number;
  /** Minimum factor to avoid completely muting background music. */
  floorVolume?: number;
  /** Toggle to disable ducking without stripping config. */
  enabled?: boolean;
}

export interface MusicElement {
  url: string;
  volume: number;
  ducking?: MusicDuckingConfig;
}

export interface Timeline {
  title: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  backgrounds: BackgroundElement[];
  text: TextElement[];
  audio: AudioElement[];
  music?: MusicElement;
}

export interface SubtitleStyle {
  position: "top" | "bottom" | "center";
  fontSize: "small" | "medium" | "large" | "xlarge";
  fontFamily: "roboto" | "montserrat" | "inter" | "poppins";
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  paddingBottom: number;
  paddingTop: number;
}

export const defaultSubtitleStyle: SubtitleStyle = {
  position: "bottom",
  fontSize: "large",
  fontFamily: "roboto",
  textColor: "#FFFFFF",
  highlightColor: "#F2E205",
  outlineColor: "#1A1A1D",
  outlineWidth: 2,
  paddingBottom: 64,
  paddingTop: 64,
};

export const fontSizeMap: Record<SubtitleStyle["fontSize"], { base: number; emphasis: number }> = {
  small: { base: 32, emphasis: 38 },
  medium: { base: 40, emphasis: 46 },
  large: { base: 48, emphasis: 58 },
  xlarge: { base: 56, emphasis: 68 },
};
