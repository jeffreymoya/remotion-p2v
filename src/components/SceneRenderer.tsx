import React from "react";
import { useCurrentFrame, AbsoluteFill, Audio, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import type { TransitionPresentation } from "@remotion/transitions";
import type { SceneScript, SceneBlockType, TransitionConfigType } from "../lib/scene-script-schema";
import { palette } from "./tokens";
import { BLOCK_MAP } from "./blocks/_registry";
import { createAssetResolver } from "./asset-resolver";
import type { AssetResolver } from "./asset-resolver";
import { assertBlockRegistrySync } from "../lib/component-catalog";
import { assertMotionRegistrySync } from "../motion/_registry";

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

assertBlockRegistrySync(Object.keys(BLOCK_MAP));
assertMotionRegistrySync();

const SequenceShell: React.FC<{
  block: SceneBlockType;
  resolveAsset: AssetResolver;
}> = ({ block, resolveAsset }) => {
  const frame = useCurrentFrame();
  const BlockComponent = BLOCK_MAP[block.type];
  if (!BlockComponent) return null;
  return <BlockComponent {...block} frame={frame} resolveAsset={resolveAsset} />;
};

interface SceneRendererProps {
  script: SceneScript;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ script }) => {
  const crossFadeFrames = script.crossFadeFrames ?? 15;
  const resolveAsset = React.useMemo(
    () => createAssetResolver(script.assets),
    [script.assets],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg }}>
      {script.audioFile && <Audio src={staticFile(script.audioFile)} />}
      <TransitionSeries>
        {script.scenes.flatMap((block, i) => {
          const durationInFrames = block.frameRange[1] - block.frameRange[0];
          const elements: React.ReactNode[] = [];

          if (i > 0 && block.transition) {
            elements.push(
              <TransitionSeries.Transition
                key={`t-${i}`}
                timing={linearTiming({ durationInFrames: crossFadeFrames })}
                presentation={presentationFor(block.transition as TransitionConfigType)}
              />,
            );
          }

          elements.push(
            <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={durationInFrames}>
              <SequenceShell block={block} resolveAsset={resolveAsset} />
            </TransitionSeries.Sequence>,
          );

          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
