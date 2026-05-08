import React from "react";
import { useCurrentFrame, AbsoluteFill } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import type { SceneScript, SceneBlockType } from "../lib/scene-script-schema";
import { palette } from "./tokens";
import { Scene } from "./primitives";
import * as Blocks from "./blocks";
import { createAssetResolver } from "./asset-resolver";

loadInter("normal", { weights: ["400", "700", "800"], subsets: ["latin"] });
loadJetBrainsMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

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
  CustomScene: Blocks.CustomScene,
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
      {script.scenes.map((block, i) => {
        const BlockComponent = BLOCK_MAP[block.type];
        if (!BlockComponent) return null;

        return (
          <Scene
            key={i}
            frameRange={block.frameRange}
            frame={frame}
            crossFadeFrames={crossFadeFrames}
          >
            <BlockComponent {...block} frame={frame} resolveAsset={resolveAsset} />
          </Scene>
        );
      })}
    </AbsoluteFill>
  );
};
