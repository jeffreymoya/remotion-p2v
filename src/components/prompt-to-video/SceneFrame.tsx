import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { computeSceneSlotStyles } from "./animation-executor";
import type { GeneratedScene, SceneAnimationPlan } from "./schema";
import { getEntranceDuration, getExitStart } from "./timing";
import {
  EvidenceComparison,
  HookCard,
  MechanismDiagram,
  PayoffCallout,
  TradeoffSplit,
} from "./visual-primitives";

interface SceneFrameProps {
  scene: GeneratedScene;
  scenePlan?: SceneAnimationPlan | null;
}

function SceneVisual({
  scene,
  slotStyles,
}: SceneFrameProps & { slotStyles: Record<string, CSSProperties> }) {
  const props = {
    headline: scene.visual.headline,
    callouts: scene.visual.callouts,
    palette: scene.palette,
    slotStyles,
  };

  switch (scene.visual.role) {
    case "hook-card":
      return <HookCard {...props} />;
    case "mechanism-diagram":
      return <MechanismDiagram {...props} />;
    case "evidence-comparison":
      return <EvidenceComparison {...props} />;
    case "tradeoff-split":
      return <TradeoffSplit {...props} />;
    case "payoff-callout":
      return <PayoffCallout {...props} />;
    default:
      return <HookCard {...props} />;
  }
}

export function SceneFrame({ scene, scenePlan }: SceneFrameProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slotStyles = scenePlan
    ? computeSceneSlotStyles(scenePlan, frame, fps)
    : {};

  const { durationFrames } = scene;
  const entranceDuration = getEntranceDuration(durationFrames);
  const exitStart = getExitStart(durationFrames);
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.7 },
    durationInFrames: entranceDuration,
  });
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationFrames],
    [1, scene.transition === "none" ? 1 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const headerAnim = slotStyles.header ?? {};
  const footerAnim = slotStyles.footer ?? {};
  const bodyAnim = slotStyles.body ?? {};

  return (
    <AbsoluteFill
      data-testid={`prompt-video-scene-${scene.id}`}
      style={{
        backgroundColor: scene.palette.background,
        color: scene.palette.foreground,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        opacity: slotStyles.body?.opacity !== undefined ? undefined : exitOpacity,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${scene.palette.background}, rgba(255,255,255,0.05))`,
        }}
      />
      <AbsoluteFill
        style={{
          padding: "72px 96px",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: 34,
          transform: `translateY(${interpolate(entrance, [0, 1], [40, 0])}px) scale(${interpolate(entrance, [0, 1], [0.98, 1])})`,
          opacity: slotStyles.body?.opacity,
        }}
      >
        <header
          data-testid="prompt-video-scene-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            ...headerAnim,
          }}
        >
          <div
            style={{
              color: scene.palette.muted,
              fontSize: 26,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {scene.title}
          </div>
          <div
            data-testid="prompt-video-role-badge"
            style={{
              backgroundColor: scene.palette.accent,
              borderRadius: 999,
              color: scene.palette.background,
              fontSize: 24,
              fontWeight: 900,
              padding: "10px 18px",
            }}
          >
            {scene.visual.role.replace("-", " ")}
          </div>
        </header>

        <main
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...bodyAnim,
          }}
        >
          <SceneVisual scene={scene} slotStyles={slotStyles} />
        </main>

        <footer
          style={{
            color: scene.palette.muted,
            fontSize: 28,
            lineHeight: 1.22,
            maxWidth: 1280,
            ...footerAnim,
          }}
        >
          {scene.narrationSummary}
        </footer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
