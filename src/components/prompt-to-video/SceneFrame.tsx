import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { GeneratedScene } from "./schema";
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
}

function SceneVisual({ scene }: SceneFrameProps) {
  const props = {
    headline: scene.visual.headline,
    callouts: scene.visual.callouts,
    palette: scene.palette,
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

export function SceneFrame({ scene }: SceneFrameProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entranceDuration = getEntranceDuration(scene.durationFrames);
  const exitStart = getExitStart(scene.durationFrames);
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.7 },
    durationInFrames: entranceDuration,
  });
  const exitOpacity = interpolate(
    frame,
    [exitStart, scene.durationFrames],
    [1, scene.transition === "none" ? 1 : 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      data-testid={`prompt-video-scene-${scene.id}`}
      style={{
        backgroundColor: scene.palette.background,
        color: scene.palette.foreground,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        opacity: exitOpacity,
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
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
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
          }}
        >
          <SceneVisual scene={scene} />
        </main>

        <footer
          style={{
            color: scene.palette.muted,
            fontSize: 28,
            lineHeight: 1.22,
            maxWidth: 1280,
          }}
        >
          {scene.narrationSummary}
        </footer>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
