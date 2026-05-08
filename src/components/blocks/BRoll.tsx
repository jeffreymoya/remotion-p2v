import React from "react";
import { spring, interpolate, staticFile } from "remotion";
import { easing } from "../tokens";
import type { AssetResolver } from "../asset-resolver";

interface OverlayAsset {
  label: string;
  x: number;
  y: number;
  scale?: number;
  entrance?: "fadeIn" | "slideUp" | "slideLeft" | "springPop";
  entranceFrame: number;
}

interface BRollProps {
  frameRange: [number, number];
  frame: number;
  backgroundAsset: string;
  overlayAssets?: OverlayAsset[];
  caption?: string;
  resolveAsset?: AssetResolver;
}

export const BRoll: React.FC<BRollProps> = ({
  frameRange,
  frame,
  backgroundAsset,
  overlayAssets,
  caption,
  resolveAsset = (assetRef) => assetRef,
}) => {
  const [start] = frameRange;
  const localFrame = frame - start;

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

        if (assetLocalFrame >= 0) {
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
                fps: 30,
                from: 0,
                to: asset.scale ?? 1,
                config: easing.snappy,
              });
              opacity = assetLocalFrame >= 0 ? 1 : 0;
              transform = `translate(-50%, -50%) scale(${s})`;
              break;
            }
          }
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
