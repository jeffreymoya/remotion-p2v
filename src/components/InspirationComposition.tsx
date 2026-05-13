import React from "react";
import {
  AbsoluteFill,
  Audio,
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { InspirationScript } from "../lib/inspire/inspire-schema";
import { KineticCaption } from "./KineticCaption";

const coverStyle: React.CSSProperties = {
  objectFit: "cover",
  width: "100%",
  height: "100%",
};

const TRANSITION_FRAMES = 15;

export const InspirationComposition: React.FC<InspirationScript> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { clips, audioPath, wordTimings, sentences, durationInFrames } = props;

  const renderVideo = (clip: typeof clips[number], durationFrames: number) => {
    const video = (
      <OffthreadVideo
        src={staticFile(clip.videoPath)}
        style={coverStyle}
      />
    );
    if (clip.loop) {
      return <Loop durationInFrames={durationFrames}>{video}</Loop>;
    }
    return video;
  };

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Video layer */}
      {clips.length === 1 ? (
        renderVideo(clips[0], durationInFrames)
      ) : (
        <TransitionSeries>
          {clips.flatMap((clip, i) => {
            const duration = clip.endFrame - clip.startFrame;
            const seq = (
              <TransitionSeries.Sequence
                key={`clip-${i}`}
                durationInFrames={duration}
              >
                {renderVideo(clip, duration)}
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

      {/* Dim overlay */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Audio */}
      <Audio src={staticFile(audioPath)} />

      {/* Kinetic captions */}
      <KineticCaption
        frame={frame}
        fps={fps}
        wordTimings={wordTimings}
        sentences={sentences}
      />
    </AbsoluteFill>
  );
};
