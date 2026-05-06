import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

import type { GeneratedPromptVideoProps } from "./schema";
import { SceneFrame } from "./SceneFrame";
import { getLocalFrame, getSceneFrameRanges } from "./timing";

export function GeneratedPromptVideo({ run }: GeneratedPromptVideoProps) {
  const frame = useCurrentFrame();

  if (!run) {
    throw new Error("GeneratedPromptVideo requires a validated generated run");
  }

  const ranges = getSceneFrameRanges(run.scenes);

  return (
    <AbsoluteFill
      data-testid="prompt-video-root"
      style={{ backgroundColor: "#111111" }}
    >
      {ranges.map(({ scene, startFrame }) => (
        <Sequence
          key={scene.id}
          from={startFrame}
          durationInFrames={scene.durationFrames}
          name={scene.title}
        >
          <SceneFrame scene={scene} />
        </Sequence>
      ))}
      <div
        data-testid="prompt-video-frame-readout"
        style={{
          position: "absolute",
          right: 24,
          bottom: 18,
          color: "rgba(255, 255, 255, 0.55)",
          fontFamily: "monospace",
          fontSize: 18,
        }}
      >
        {frame} / {run.totalDurationFrames}
      </div>
      {ranges.map(({ scene, startFrame }) => {
        const localFrame = getLocalFrame(frame, startFrame);
        return localFrame === 0 ? (
          <span key={`${scene.id}-marker`} data-testid="prompt-video-sequence-marker" />
        ) : null;
      })}
    </AbsoluteFill>
  );
}
