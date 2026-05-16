import React from "react";
import {
  AbsoluteFill,
  Audio,
  Loop,
  OffthreadVideo,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { InspirationScript } from "../lib/inspire/inspire-schema";
import type {
  ClipDirective,
  KenBurnsDirection,
  OverlayMood,
} from "../lib/inspire/art-direction-schema";
import { KineticCaption } from "./KineticCaption";

const DEFAULT_CYCLE: KenBurnsDirection[] = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
];

const directionForClip = (clipIndex: number): KenBurnsDirection =>
  DEFAULT_CYCLE[clipIndex % DEFAULT_CYCLE.length];

interface MoodLayer {
  highlights: string | null;
  shadows: string | null;
}

interface ColorGrade {
  filter: string;
  overlay: MoodLayer;
}

const COLOR_GRADES: Record<OverlayMood, ColorGrade> = {
  warm: {
    filter: "saturate(1.15) contrast(1.05) brightness(1.02) sepia(0.08)",
    overlay: {
      highlights:
        "radial-gradient(ellipse at center, rgba(255,180,80,0.20), transparent 65%)",
      shadows:
        "linear-gradient(to bottom, rgba(20,40,90,0.25), transparent 40%)",
    },
  },
  cool: {
    filter: "saturate(0.9) contrast(1.05) brightness(1.0) hue-rotate(-8deg)",
    overlay: {
      highlights:
        "radial-gradient(ellipse at center, rgba(80,180,255,0.20), transparent 65%)",
      shadows:
        "linear-gradient(to bottom, rgba(60,30,10,0.20), transparent 40%)",
    },
  },
  dramatic: {
    filter: "saturate(0.8) contrast(1.2) brightness(0.95)",
    overlay: {
      highlights: null,
      shadows:
        "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
    },
  },
  neutral: {
    filter: "none",
    overlay: { highlights: null, shadows: null },
  },
  moody: {
    filter: "saturate(0.6) contrast(1.15) brightness(0.88) hue-rotate(5deg)",
    overlay: {
      highlights: null,
      shadows:
        "linear-gradient(to bottom, rgba(10,10,30,0.35), transparent 50%)",
    },
  },
  reflective: {
    filter: "saturate(0.75) contrast(1.0) brightness(1.05) sepia(0.12)",
    overlay: {
      highlights:
        "radial-gradient(ellipse at center, rgba(200,180,160,0.15), transparent 60%)",
      shadows:
        "linear-gradient(to bottom, rgba(40,30,60,0.2), transparent 45%)",
    },
  },
  melancholic: {
    filter: "saturate(0.45) contrast(1.1) brightness(0.9) hue-rotate(-5deg)",
    overlay: {
      highlights:
        "radial-gradient(ellipse at center, rgba(100,120,180,0.12), transparent 65%)",
      shadows:
        "linear-gradient(to bottom, rgba(0,0,20,0.3), transparent 50%)",
    },
  },
  ethereal: {
    filter: "saturate(0.85) contrast(0.9) brightness(1.1) hue-rotate(10deg)",
    overlay: {
      highlights:
        "radial-gradient(ellipse at center, rgba(200,180,255,0.18), transparent 55%)",
      shadows: null,
    },
  },
};

const MoodOverlay: React.FC<{ mood: OverlayMood }> = ({ mood }) => {
  const { highlights, shadows } = COLOR_GRADES[mood].overlay;
  return (
    <>
      {highlights ? (
        <AbsoluteFill
          style={{ background: highlights, pointerEvents: "none" }}
        />
      ) : null}
      {shadows ? (
        <AbsoluteFill
          style={{ background: shadows, pointerEvents: "none" }}
        />
      ) : null}
    </>
  );
};

const KenBurnsClip: React.FC<{
  src: string;
  durationFrames: number;
  loop: boolean;
  direction: KenBurnsDirection;
  colorGrade?: string;
}> = ({ src, durationFrames, loop, direction, colorGrade }) => {
  const frame = useCurrentFrame();

  const baseScale =
    direction === "zoom-out" ? 1.1 : direction === "zoom-in" ? 1.0 : 1.1;
  const endScale =
    direction === "zoom-out" ? 1.0 : direction === "zoom-in" ? 1.06 : 1.1;

  const scale = interpolate(frame, [0, durationFrames], [baseScale, endScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX =
    direction === "pan-left"
      ? interpolate(frame, [0, durationFrames], [0, -3], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : direction === "pan-right"
        ? interpolate(frame, [0, durationFrames], [0, 3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 0;

  const video = (
    <OffthreadVideo
      muted
      src={src}
      style={{ objectFit: "cover", width: "100%", height: "100%" }}
    />
  );

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translateX(${translateX}%)`,
          transformOrigin: "center center",
          filter: colorGrade && colorGrade !== "none" ? colorGrade : undefined,
        }}
      >
        {loop ? <Loop durationInFrames={durationFrames}>{video}</Loop> : video}
      </div>
    </div>
  );
};

const TRANSITION_FRAMES = 15;

const BG_MUSIC_VOLUME = 0.15;

export const InspirationComposition: React.FC<InspirationScript> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    clips,
    audioPath,
    backgroundMusicPath,
    wordTimings,
    sentences,
    durationInFrames,
    artDirection,
  } = props;

  const clipDirective = (clipIndex: number): ClipDirective =>
    artDirection.clips.find((c) => c.clipIndex === clipIndex) ?? {
      clipIndex,
      kenBurns: directionForClip(clipIndex),
      overlayMood: "neutral",
    };

  const currentClipIndex =
    clips.find((c) => frame >= c.startFrame && frame < c.endFrame)?.clipIndex ??
    0;
  const currentMood = clipDirective(currentClipIndex).overlayMood;

  const captionStyleBySentence = Object.fromEntries(
    artDirection.sentences.map((s) => [s.sentenceIndex, s.captionStyle]),
  );
  const emphasisBySentence = Object.fromEntries(
    artDirection.sentences.map((s) => [s.sentenceIndex, s.emphasisWordIndexes]),
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Video layer */}
      {clips.length === 1 ? (
        <KenBurnsClip
          src={staticFile(clips[0].videoPath)}
          durationFrames={durationInFrames}
          loop={clips[0].loop}
          direction={clipDirective(clips[0].clipIndex).kenBurns}
          colorGrade={COLOR_GRADES[clipDirective(clips[0].clipIndex).overlayMood].filter}
        />
      ) : (
        <TransitionSeries>
          {clips.flatMap((clip, i) => {
            const duration = clip.endFrame - clip.startFrame;
            const directive = clipDirective(clip.clipIndex);
            const seq = (
              <TransitionSeries.Sequence
                key={`clip-${i}`}
                durationInFrames={duration}
              >
                <KenBurnsClip
                  src={staticFile(clip.videoPath)}
                  durationFrames={duration}
                  loop={clip.loop}
                  direction={directive.kenBurns}
                  colorGrade={COLOR_GRADES[directive.overlayMood].filter}
                />
              </TransitionSeries.Sequence>
            );

            if (i === clips.length - 1) return [seq];

            return [
              seq,
              <TransitionSeries.Transition
                key={`tx-${i}`}
                presentation={fade()}
                timing={linearTiming({
                  durationInFrames: TRANSITION_FRAMES,
                })}
              />,
            ];  
          })}
        </TransitionSeries>
      )}

      {/* Mood overlay — driven by current clip's directive */}
      <MoodOverlay mood={currentMood} />

      {/* Bottom-weighted gradient — darkens text zone */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Radial vignette — cinematic edge darkening */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Audio */}
      <Audio src={staticFile(audioPath)} />

      {/* Background music */}
      {backgroundMusicPath && (
        <Audio
          src={staticFile(backgroundMusicPath)}
          volume={BG_MUSIC_VOLUME}
          loop
        />
      )}

      {/* Kinetic captions */}
      <KineticCaption
        frame={frame}
        fps={fps}
        wordTimings={wordTimings}
        sentences={sentences}
        captionStyleBySentence={captionStyleBySentence}
        emphasisBySentence={emphasisBySentence}
      />
    </AbsoluteFill>
  );
};
