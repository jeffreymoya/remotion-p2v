import React from "react";
import { z } from "zod";
import { spring, interpolate, staticFile, useVideoConfig } from "remotion";
import { easing } from "../tokens";
import type { AssetResolver } from "../asset-resolver";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";
import { MotionBehavior, MOTION_PLAYBOOK } from "../../motion/_registry";
import type { MotionBehaviorType } from "../../motion/_registry";

export const schema = z.object({
  type: z.literal("BRoll"),
  frameRange: FrameRange,
  backgroundAsset: z.string(),
  overlayAssets: z.array(z.object({
    label: z.string(),
    x: z.number(),
    y: z.number(),
    scale: z.number().default(1),
    entrance: z.enum(["fadeIn", "slideUp", "slideLeft", "springPop"]).default("fadeIn"),
    entranceFrame: z.number().int().default(0),
    motion: MotionBehavior.default("static"),
  })).optional(),
  caption: z.string().optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "BRoll",
  role: "visual",
  guidelineSection: "§3 Visual — B-Roll",
  whenToUse: "Standalone cutaway showing a real-world image. Use for 30–90 frames only. NEVER use as a backdrop for text blocks.",
  effect: "Full-screen background image with optional positioned overlay assets that animate in individually. Caption fades in at the bottom.",
  props: {
    backgroundAsset: "string: Asset label from the assets array (role: background)",
    overlayAssets: "{label: string, x: number, y: number, scale?: number, entrance?: 'fadeIn'|'slideUp'|'slideLeft'|'springPop' (defaults to 'fadeIn'), entranceFrame: number (defaults to 0 = appear immediately), motion?: MotionBehavior (defaults to 'static')}[]?: Overlay objects positioned at (x%, y%). entranceFrame controls staggered entry — use 0 for the first overlay, increment for later ones (e.g. 10, 20). Set motion to a playbook behavior for sustained animation; otherwise the entrance animation runs once.",
    caption: "string?: Caption text at the bottom",
  },
};

interface OverlayAsset {
  label: string;
  x: number;
  y: number;
  scale?: number;
  entrance?: "fadeIn" | "slideUp" | "slideLeft" | "springPop";
  entranceFrame: number;
  motion?: MotionBehaviorType;
}

interface BRollProps {
  frameRange: [number, number];
  frame: number;
  backgroundAsset: string;
  overlayAssets?: OverlayAsset[];
  caption?: string;
  resolveAsset?: AssetResolver;
}

function entranceAnimation(
  asset: OverlayAsset,
  assetLocalFrame: number,
  fps: number,
): { opacity: number; transform: string } {
  let opacity = 0;
  let transform = `translate(-50%, -50%) scale(${asset.scale ?? 1})`;

  switch (asset.entrance ?? "fadeIn") {
    case "fadeIn": {
      opacity = interpolate(assetLocalFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    }
    case "slideUp": {
      opacity = interpolate(assetLocalFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const ty = interpolate(assetLocalFrame, [0, 15], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transform = `translate(-50%, calc(-50% + ${ty}px)) scale(${asset.scale ?? 1})`;
      break;
    }
    case "slideLeft": {
      opacity = interpolate(assetLocalFrame, [0, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const tx = interpolate(assetLocalFrame, [0, 15], [60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      transform = `translate(calc(-50% + ${tx}px), -50%) scale(${asset.scale ?? 1})`;
      break;
    }
    case "springPop": {
      const s = spring({
        frame: assetLocalFrame,
        fps,
        from: 0,
        to: asset.scale ?? 1,
        config: easing.snappy,
      });
      opacity = 1;
      transform = `translate(-50%, -50%) scale(${s})`;
      break;
    }
  }

  return { opacity, transform };
}

export const BRoll: React.FC<BRollProps> = ({
  frameRange,
  frame,
  backgroundAsset,
  overlayAssets,
  caption,
  resolveAsset = (assetRef) => assetRef,
}) => {
  const { fps } = useVideoConfig();
  const localFrame = frame;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={staticFile(resolveAsset(backgroundAsset))}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {overlayAssets?.map((asset) => {
        const assetLocalFrame = localFrame - asset.entranceFrame;
        let opacity = 0;
        let transform = `translate(-50%, -50%) scale(${asset.scale ?? 1})`;

        if (assetLocalFrame < 0) {
          // Not yet entered — keep hidden
        } else if (asset.motion && asset.motion !== "static") {
          // Playbook drives the full lifecycle (entry + sustained)
          const raw = MOTION_PLAYBOOK[asset.motion]({
            localFrame: assetLocalFrame,
            fps,
            duration: frameRange[1] - frameRange[0],
            baseScale: asset.scale ?? 1,
          });
          opacity = raw.opacity ?? 1;
          transform = `translate(-50%, -50%) ${raw.transform}`;
        } else {
          // Fallback: original entrance animation
          ({ opacity, transform } = entranceAnimation(asset, assetLocalFrame, fps));
        }

        return (
          <img
            key={asset.label}
            src={staticFile(resolveAsset(asset.label))}
            style={{
              position: "absolute",
              left: `${asset.x}%`,
              top: `${asset.y}%`,
              transform,
              opacity,
              maxWidth: "40%",
              maxHeight: "40%",
            }}
          />
        );
      })}
      {caption && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 28,
            color: "#fff",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            opacity: interpolate(localFrame, [15, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

export { BRoll as Component };
