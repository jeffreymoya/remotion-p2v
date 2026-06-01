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
import { HATTAB_LUT_ID, PALETTE_MAP } from "./docu-tokens";
import { HaTTabLutDefs } from "./HaTTabLut";
import { DocuKenBurns } from "./DocuKenBurns";
import { DocuTitleCard } from "./DocuTitleCard";
import type { DocuOverlay } from "../../lib/docu/overlays/registry";
import { OVERLAY_REGISTRY } from "../../lib/docu/overlays/registry";
import type { DocuSegmentMeta } from "../../lib/docu/segment-types";
import { RENDER_REGISTRY, type OverlayRenderCtx } from "./overlays/render-registry";
import { YouTubeInterviewCaptions } from "./YouTubeInterviewCaptions";
import { CitationChyron } from "./CitationChyron";
import type { InterviewCaptionWord, CitationBlock } from "../../lib/docu/youtube-pipeline";

export interface DocuShot {
  videoPath?: string;
  imagePath?: string;
  mediaType: "video" | "image";
  loop: boolean;
  startFrame: number;
  endFrame: number;
  palette: DocuPalette;
  isInterviewClip?: boolean;
  startFrom?: number;
  captionWords?: InterviewCaptionWord[];
}

export interface DocuClip {
  clipIndex: number;
  startFrame: number;
  endFrame: number;
  shots: DocuShot[];
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
  segments?: DocuSegmentMeta[];
  citationBlocks?: CitationBlock[];
  durationInFrames: number;
  fps: 30;
  width: 1920;
  height: 1080;
}

const TITLE_CARD_FRAMES = 90;
const L_CUT_TAIL_FRAMES = 45;

const TitleCardFade: React.FC<{ topic: string }> = ({ topic }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 10, TITLE_CARD_FRAMES - 15, TITLE_CARD_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <DocuTitleCard title={topic} subtitle="" durationInFrames={TITLE_CARD_FRAMES} />
    </AbsoluteFill>
  );
};

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
    if (OVERLAY_REGISTRY[o.type].surface !== "overlay") return acc;
    const local = frame - o.startFrame;
    const dur = o.endFrame - o.startFrame;
    if (local < 0 || local >= dur) return acc;
    const BLUR_RAMP = 6;
    const enter = interpolate(local, [0, BLUR_RAMP], [0, 1], { extrapolateRight: "clamp" });
    const exit = interpolate(local, [dur - BLUR_RAMP, dur], [1, 0], { extrapolateLeft: "clamp" });
    return Math.max(acc, Math.min(enter, exit));
  }, 0);
  const blurPx = blurProgress * 10;

  const isCitationActive = (props.citationBlocks ?? []).some(
    (b) => frame >= b.startFrame && frame < b.endFrame,
  );

  const currentShot = useMemo(() => {
    return allShots.find((s) => frame >= s.startFrame && frame < s.endFrame);
  }, [allShots, frame]);

  const isInterviewActive = useMemo(() => {
    const blocks = props.citationBlocks ?? [];
    for (const block of blocks) {
      const duckEnd = block.endFrame + L_CUT_TAIL_FRAMES;
      if (frame >= block.startFrame && frame < duckEnd) {
        const dur = duckEnd - block.startFrame;
        const local = frame - block.startFrame;
        const RAMP = 6;
        return {
          active: true,
          progress: Math.min(
            interpolate(local, [0, RAMP], [0, 1], { extrapolateRight: "clamp" }),
            interpolate(local, [dur - RAMP, dur], [1, 0], { extrapolateLeft: "clamp" }),
          ),
        };
      }
    }
    return { active: false, progress: 0 };
  }, [frame, props.citationBlocks]);

  const narrationVolume = isInterviewActive.active
    ? interpolate(isInterviewActive.progress, [0, 1], [1, 0])
    : 1;

  const currentPalette: DocuPalette = useMemo(() => {
    const shot = allShots.find((s) => frame >= s.startFrame && frame < s.endFrame);
    return shot?.palette ?? "cool-tech";
  }, [allShots, frame]);

  const palette = PALETTE_MAP[currentPalette];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* HaTTab cinematic LUT — must be rendered before any url(#hattab-cinematic-lut) reference */}
      <HaTTabLutDefs />

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
              startFrom={shot.startFrom}
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
                filter: `${
                  PALETTE_MAP[shot.palette].filter
                } url(#${HATTAB_LUT_ID})${
                  blurPx > 0 && !isCitationActive ? ` blur(${blurPx}px)` : ""
                }`,
                width: "100%",
                height: "100%",
              }}
            >
              {shot.mediaType === "image" ? (
                <DocuKenBurns durationInFrames={shotDuration} shotIndex={i}>
                  {mediaElement}
                </DocuKenBurns>
              ) : shot.loop ? (
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

      {/* Palette tint — per-shot cool/warm color cast at frame top */}
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
        <Audio src={staticFile(props.audioPath)} volume={narrationVolume} />
      )}

      {/* Citation block audio beds — interview clips play as independent audio */}
      {(props.citationBlocks ?? []).map((block, i) => (
        <Sequence key={`citation-bed-${i}`} from={block.startFrame} durationInFrames={block.endFrame - block.startFrame}>
          <Audio src={staticFile(block.videoPath)} volume={1} />
        </Sequence>
      ))}

      {/* Overlays */}
      {overlays.map((o, i) => {
        const overlayDuration = o.endFrame - o.startFrame;
        const activeShot = allShots.find(
          (s) => o.startFrame >= s.startFrame && o.startFrame < s.endFrame,
        );
        const ctx: OverlayRenderCtx = {
          durationInFrames: props.durationInFrames,
          activeShot,
          allShots,
          palette: currentPalette,
        };

        return (
          <Sequence
            key={`overlay-${i}`}
            from={o.startFrame}
            durationInFrames={overlayDuration}
          >
            {RENDER_REGISTRY[o.type](o, ctx)}
          </Sequence>
        );
      })}

      {/* Title card — 3-second opener over first shot */}
      <Sequence from={0} durationInFrames={TITLE_CARD_FRAMES}>
        <TitleCardFade topic={props.topic} />
      </Sequence>

      {/* Citation block captions — word-by-word stagger reveal for full block duration */}
      {(props.citationBlocks ?? []).map((block, i) => {
        if (!block.captionWords || block.captionWords.length === 0) return null;
        return (
          <Sequence
            key={`citation-captions-${i}`}
            from={block.startFrame}
            durationInFrames={block.endFrame - block.startFrame}
          >
            <YouTubeInterviewCaptions
              words={block.captionWords}
              fps={props.fps}
            />
          </Sequence>
        );
      })}

      {/* Citation block chyrons — source attribution strip */}
      {(props.citationBlocks ?? []).map((block, i) => {
        if (!block.name && !block.sourceLabel) return null;
        const dur = block.endFrame - block.startFrame;
        return (
          <Sequence key={`chyron-${i}`} from={block.startFrame} durationInFrames={dur}>
            <CitationChyron
              name={block.name}
              sourceLabel={block.sourceLabel}
              durationInFrames={dur}
            />
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};
