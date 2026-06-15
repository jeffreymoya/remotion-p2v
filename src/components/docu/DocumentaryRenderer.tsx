import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from "remotion";
import type { CompositionPlan, ResolvedScene } from "../../lib/pipeline/schemas";
import { resolveSlotBox } from "../../lib/layout/grid";
import { COMPONENT_MAP } from "./component-map";
import { buildCaptionProps } from "../../lib/pipeline/caption";
import { Chrome } from "./common/Chrome";
import { BoxSizeProvider } from "./common/layout-box";
import { DocumentaryCaption, documentaryCaptionDefaults } from "./captions/DocumentaryCaption";

function toStaticPath(p: string): string {
  return p.replace(/^\/?public\//, "").replace(/^\//, "");
}

const SceneView: React.FC<{ scene: ResolvedScene; fps: number; captionsEnabled: boolean }> = ({ scene, fps, captionsEnabled }) => {
  const caption = buildCaptionProps(scene, fps);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0b1220 0%, #0a0a0a 70%)" }}>
      {scene.background.assetRef ? (
        <Img
          src={staticFile(toStaticPath(scene.background.assetRef))}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      {scene.chrome ? (
        <Chrome
          num={scene.chrome.num}
          name={scene.chrome.name}
          meta={scene.chrome.meta}
          accent={scene.chrome.accent}
          theme={scene.chrome.theme}
        />
      ) : null}
      {scene.layers.map((layer, i) => {
        const Comp = COMPONENT_MAP[layer.component];
        if (!Comp || layer.component === "DocumentaryCaption") return null;
        const delay = layer.resolvedAnchors[0]?.delayFrames ?? 0;
        return (
          <Sequence key={i} from={delay} durationInFrames={Math.max(1, scene.durationInFrames - delay)}>
            <div
              data-layer-role={layer.layerRole}
              data-component={layer.component}
              style={{
                position: "absolute",
                left: layer.box.x,
                top: layer.box.y,
                width: layer.box.w,
                height: layer.box.h,
                zIndex: layer.z,
                overflow: "hidden",
              }}
            >
              <BoxSizeProvider size={{ w: layer.box.w, h: layer.box.h }}>
                <Comp {...layer.props} />
              </BoxSizeProvider>
            </div>
          </Sequence>
        );
      })}
      {captionsEnabled ? (
        <DocumentaryCaption
          {...caption}
          accent={documentaryCaptionDefaults.accent}
          textColor={documentaryCaptionDefaults.textColor}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const DocumentaryRenderer: React.FC<CompositionPlan> = (plan) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {plan.audioPath ? <Audio src={staticFile(toStaticPath(plan.audioPath))} /> : null}
      {plan.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.fromFrame} durationInFrames={scene.durationInFrames}>
          <SceneView scene={scene} fps={plan.fps} captionsEnabled={plan.captionsEnabled ?? false} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const DOCUMENTARY_PREVIEW_PLAN: CompositionPlan = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 120,
  audioPath: "",
  captionsEnabled: false,
  scenes: [
    {
      id: "preview-1",
      role: "hook",
      focalOwner: "title",
      fromFrame: 0,
      durationInFrames: 120,
      background: { assetRef: "" },
      chrome: { num: "01", name: "Documentary Preview", meta: "Episode Opener" },
      layers: [
        {
          component: "TitleCard",
          layerRole: "primary",
          props: { line1: "Documentary", line2: "Preview" },
          resolvedAnchors: [],
          slot: "full",
          z: 2,
          box: resolveSlotBox("full"),
        },
      ],
      wordTimings: [
        { word: "Documentary", startSeconds: 0, endSeconds: 0.6 },
        { word: "Preview.", startSeconds: 0.6, endSeconds: 1.2 },
      ],
      emphasisWordIndexes: [0],
      evidenceRefs: [],
    },
  ],
};
