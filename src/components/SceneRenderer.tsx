import React from "react";
import { useCurrentFrame, AbsoluteFill, interpolate, Audio, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import type { TransitionPresentation } from "@remotion/transitions";
import type { SceneScript, SceneBlockType, TransitionConfigType } from "../lib/scene-script-schema";
import { palette } from "./tokens";
import { Scene } from "./primitives";
import * as Blocks from "./blocks";
import { createAssetResolver } from "./asset-resolver";

loadInter("normal", { weights: ["400", "700", "800"], subsets: ["latin"] });
loadJetBrainsMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

function presentationFor(
  transition: TransitionConfigType,
): TransitionPresentation<Record<string, unknown>> {
  switch (transition.kind) {
    case "slide":
      return slide({ direction: transition.direction ?? "from-left" }) as TransitionPresentation<Record<string, unknown>>;
    case "fade":
      return fade() as TransitionPresentation<Record<string, unknown>>;
    case "wipe":
      return wipe({ direction: transition.direction ?? "from-left" }) as TransitionPresentation<Record<string, unknown>>;
    case "flip":
      return flip({ direction: transition.direction ?? "from-left" }) as TransitionPresentation<Record<string, unknown>>;
  }
}

const BLOCK_MAP: Record<string, React.FC<any>> = {
  ContradictionHook: Blocks.ContradictionHook,
  CostOfIgnoranceHook: Blocks.CostOfIgnoranceHook,
  HiddenMechanismHook: Blocks.HiddenMechanismHook,
  MythVsEvidenceHook: Blocks.MythVsEvidenceHook,
  PromiseCard: Blocks.PromiseCard,
  ContextCard: Blocks.ContextCard,
  DiagramScene: Blocks.DiagramScene,
  ComparisonSplit: Blocks.ComparisonSplit,
  BRoll: Blocks.BRoll,
  Callout: Blocks.Callout,
  MicroQuestion: Blocks.MicroQuestion,
  ContrastReveal: Blocks.ContrastReveal,
  Reveal: Blocks.Reveal,
  Reframe: Blocks.Reframe,
  MiniPayoff: Blocks.MiniPayoff,
  Foreshadow: Blocks.Foreshadow,
  StatCounter: Blocks.StatCounter,
};

interface SceneRendererProps {
  script: SceneScript;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const crossFadeFrames = script.crossFadeFrames ?? 15;
  const resolveAsset = React.useMemo(() => createAssetResolver(script.assets), [script.assets]);

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      {script.audioFile && (
        <Audio src={staticFile(script.audioFile)} />
      )}
      {script.scenes.map((block, i) => {
        const BlockComponent = BLOCK_MAP[block.type];
        if (!BlockComponent) return null;

        const [blockStart] = block.frameRange;
        const transitionProgress = interpolate(
          frame,
          [blockStart - crossFadeFrames, blockStart],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        const pres = block.transition
          ? presentationFor(block.transition as TransitionConfigType)
          : null;

        const blockContent = (
          <BlockComponent {...block} frame={frame} resolveAsset={resolveAsset} />
        );

        return (
          <Scene
            key={i}
            frameRange={block.frameRange}
            frame={frame}
            crossFadeFrames={crossFadeFrames}
          >
            {pres ? (
              <pres.component
                presentationProgress={transitionProgress}
                presentationDirection="entering"
                passedProps={pres.props}
                presentationDurationInFrames={crossFadeFrames}
                onElementImage={() => {}}
                onUnmount={() => {}}
                bothEnteringAndExiting={false}
              >
                {blockContent}
              </pres.component>
            ) : (
              blockContent
            )}
          </Scene>
        );
      })}
    </AbsoluteFill>
  );
};
