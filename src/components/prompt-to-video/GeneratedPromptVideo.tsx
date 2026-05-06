import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

import { computeSceneDurationFromPlan } from "./animation-executor";
import type { AnimationPlan, GeneratedPromptVideoProps } from "./schema";
import { SceneFrame } from "./SceneFrame";

function getScenePlan(
  plan: AnimationPlan | null | undefined,
  sceneId: string
) {
  if (!plan) return undefined;
  return plan.scenes.find((s) => s.sceneId === sceneId);
}

function computeDurations(
  run: NonNullable<GeneratedPromptVideoProps["run"]>,
  plan: AnimationPlan | null | undefined
): number[] {
  return run.scenes.map((scene) => {
    const scenePlan = plan
      ? plan.scenes.find((s) => s.sceneId === scene.id)
      : undefined;
    return scenePlan
      ? computeSceneDurationFromPlan(scenePlan)
      : scene.durationFrames;
  });
}

function getRangesFromDurations(
  scenes: NonNullable<GeneratedPromptVideoProps["run"]>["scenes"],
  durations: number[]
) {
  let cursor = 0;
  return scenes.map((scene, i) => {
    const startFrame = cursor;
    const endFrame = startFrame + durations[i];
    cursor = endFrame;
    return { scene, startFrame, endFrame, durationFrames: durations[i] };
  });
}

export function GeneratedPromptVideo({
  run,
  animationPlan,
}: GeneratedPromptVideoProps) {
  const frame = useCurrentFrame();

  if (!run) {
    throw new Error("GeneratedPromptVideo requires a validated generated run");
  }

  const durations = computeDurations(run, animationPlan);
  const ranges = getRangesFromDurations(run.scenes, durations);
  const totalDurationFrames = durations.reduce((sum, d) => sum + d, 0);

  return (
    <AbsoluteFill
      data-testid="prompt-video-root"
      style={{ backgroundColor: "#111111" }}
    >
      {ranges.map(({ scene, startFrame, durationFrames }) => {
        const scenePlan = getScenePlan(animationPlan, scene.id);
        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={durationFrames}
            name={scene.title}
          >
            <SceneFrame scene={scene} scenePlan={scenePlan} />
          </Sequence>
        );
      })}
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
        {frame} / {totalDurationFrames}
      </div>
      {ranges.map(({ scene }) => {
        const seqMarkers: number[] = [];
        if (animationPlan) {
          const scenePlan = animationPlan.scenes.find(
            (s) => s.sceneId === scene.id
          );
          if (scenePlan) {
            for (const el of scenePlan.elements) {
              for (const op of el.ops) {
                if (op.type !== "hold") {
                  seqMarkers.push(op.startFrame);
                }
              }
            }
          }
        }
        return seqMarkers.length > 0 ? (
          <span
            key={`${scene.id}-ab`}
            data-testid="prompt-video-animation-beats"
            data-beat-count={seqMarkers.length}
          />
        ) : null;
      })}
    </AbsoluteFill>
  );
}
