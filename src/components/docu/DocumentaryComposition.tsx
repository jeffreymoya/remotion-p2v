import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { DocuPalette } from "./docu-tokens";
import { PALETTE_MAP } from "./docu-tokens";
import { KineticNumber } from "./KineticNumber";
import { HeadlineCard } from "./HeadlineCard";
import { ArticleCard } from "./ArticleCard";
import type { DocuArticleCard } from "../../lib/docu/article-pipeline";

export interface DocuShot {
  videoPath?: string;
  imagePath?: string;
  mediaType: "video" | "image";
  loop: boolean;
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
}

export interface DocuClip {
  clipIndex: number;
  startFrame: number;
  endFrame: number;
  shots: DocuShot[];
}

export interface DocuOverlay {
  type: "headline-card" | "kinetic-number";
  text: string;
  value?: number;
  unit?: "$" | "%" | "x" | "T" | "B";
  source?: string;
  palette: DocuPalette;
  startFrame: number;
  endFrame: number;
}

export interface DocuSentence {
  sentenceIndex: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  startFrame: number;
  endFrame: number;
  clipIndex: number;
  tokenWordIndexes: number[];
  emphasisWordIndexes?: number[];
}

export interface DocuScript {
  slug: string;
  topic: string;
  backgroundMusicPath?: string;
  audioPath?: string;
  wordTimings: Array<{
    word: string;
    startSeconds: number;
    endSeconds: number;
  }>;
  sentences: DocuSentence[];
  clips: DocuClip[];
  overlays: DocuOverlay[];
  articleCards?: DocuArticleCard[];
  durationInFrames: number;
  fps: 30;
  width: 1920;
  height: 1080;
}

export const DocumentaryComposition = (props: DocuScript) => {
  const frame = useCurrentFrame();
  const {
    clips,
    backgroundMusicPath,
    overlays,
  } = props;

  const allShots = useMemo(
    () => clips.flatMap((c) => c.shots),
    [clips],
  );

  const blurProgress = overlays.reduce((acc, o) => {
    const local = frame - o.startFrame;
    const dur = o.endFrame - o.startFrame;
    if (local < 0 || local >= dur) return acc;
    const BLUR_RAMP = 6;
    const enter = interpolate(local, [0, BLUR_RAMP], [0, 1], { extrapolateRight: "clamp" });
    const exit = interpolate(local, [dur - BLUR_RAMP, dur], [1, 0], { extrapolateLeft: "clamp" });
    return Math.max(acc, Math.min(enter, exit));
  }, 0);
  const blurPx = blurProgress * 10;

  const currentPalette: DocuPalette = useMemo(() => {
    const shot = allShots.find((s) => frame >= s.startFrame && frame < s.endFrame);
    return shot?.palette ?? "cool-tech";
  }, [allShots, frame]);

  const palette = PALETTE_MAP[currentPalette];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Media layer */}
      {allShots.map((shot, i) => {
        const shotDuration = shot.endFrame - shot.startFrame;
        const mediaSrc =
          shot.mediaType === "video" && shot.videoPath
            ? staticFile(shot.videoPath)
            : shot.imagePath
              ? staticFile(shot.imagePath)
              : null;

        if (!mediaSrc) return null;

        const mediaElement =
          shot.mediaType === "video" && shot.videoPath ? (
            <OffthreadVideo
              src={mediaSrc}
              volume={0}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <Img
              src={mediaSrc}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          );

        return (
          <Sequence
            key={`shot-${i}`}
            from={shot.startFrame}
            durationInFrames={shotDuration}
          >
            <div
              style={{
                filter: `${PALETTE_MAP[shot.palette].filter}${blurPx > 0 ? ` blur(${blurPx}px)` : ""}`,
                width: "100%",
                height: "100%",
              }}
            >
              {shot.loop ? (
                <Loop durationInFrames={shotDuration}>
                  {mediaElement}
                </Loop>
              ) : (
                mediaElement
              )}
            </div>
          </Sequence>
        );
      })}

      {/* Palette overlay — vignette + tint */}
      <AbsoluteFill
        style={{ background: palette.vignette, pointerEvents: "none" }}
      />
      <AbsoluteFill
        style={{ background: palette.tint, pointerEvents: "none" }}
      />

      {/* Bottom scrim */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.80) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Background music */}
      {backgroundMusicPath ? (
        <Audio src={staticFile(backgroundMusicPath)} volume={0.08} loop />
      ) : null}

      {/* Narration audio */}
      {props.audioPath && (
        <Audio src={staticFile(props.audioPath)} />
      )}

      {/* Overlays */}
      {overlays.map((o, i) => {
        const overlayDuration = o.endFrame - o.startFrame;

        return (
          <Sequence
            key={`overlay-${i}`}
            from={o.startFrame}
            durationInFrames={overlayDuration}
          >
            {o.type === "headline-card" ? (
              <HeadlineCard
                text={o.text}
                source={o.source}
                palette={o.palette}
                durationInFrames={overlayDuration}
              />
            ) : (
              <KineticNumber
                label={o.text}
                value={o.value!}
                unit={o.unit!}
                durationFrames={overlayDuration}
                palette={o.palette}
              />
            )}
          </Sequence>
        );
      })}

      {/* Article Cards */}
      {props.articleCards?.map((card) => {
        const activeShot = allShots.find(
          (s) => card.startFrame >= s.startFrame && card.startFrame < s.endFrame,
        );
        const bgImageFile = activeShot?.imagePath ?? clips[0]?.shots[0]?.imagePath ?? "";
        if (!bgImageFile) return null;
        return (
          <Sequence
            key={`article-card-${card.id}`}
            from={card.startFrame}
            durationInFrames={card.durationInFrames}
          >
            <ArticleCard
              article={card.article}
              bgImageFile={bgImageFile}
              durationInFrames={card.durationInFrames}
            />
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};
