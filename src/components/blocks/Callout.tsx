import React from "react";
import { z } from "zod";
import { interpolate, staticFile } from "remotion";
import { palette, font } from "../tokens";
import type { AssetResolver } from "../asset-resolver";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("Callout"),
  frameRange: FrameRange,
  phrase: z.string(),
  style: z.enum(["fullscreen", "overlay", "card"]).default("card"),
  backgroundAsset: z.string().optional(),
  lines: z.array(z.object({
    text: z.string(),
    icon: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "Callout",
  role: "visual",
  guidelineSection: "§3 Visual — Callout",
  whenToUse: "Emphasizes a single key phrase. Maximum 45–90 frames — this is a punch, not a lecture. phrase must never be empty.",
  effect: "Three layouts: fullscreen (giant phrase pulses with sine scale), overlay (blurred background + white card), card (centered card on dark bg). Optional lines stagger in below the phrase.",
  props: {
    phrase: "string: The key phrase to emphasize (required, non-empty)",
    style: '"fullscreen"|"overlay"|"card": Visual treatment (default: card)',
    backgroundAsset: "string?: Asset label; used only with overlay style",
    lines: "{text: string, icon?: string, color?: string}[]?: Supporting bullet lines",
  },
};

interface CalloutLine {
  text: string;
  icon?: string;
  color?: string;
}

interface CalloutProps {
  frameRange: [number, number];
  frame: number;
  phrase: string;
  style?: "fullscreen" | "overlay" | "card";
  backgroundAsset?: string;
  lines?: CalloutLine[];
  resolveAsset?: AssetResolver;
}

export const Callout: React.FC<CalloutProps> = ({
  frameRange,
  frame,
  phrase,
  style: visualStyle = "card",
  backgroundAsset,
  lines,
  resolveAsset = (assetRef) => assetRef,
}) => {
  const localFrame = frame;
  const duration = frameRange[1] - frameRange[0];

  if (visualStyle === "fullscreen") {
    const phraseOpacity = interpolate(localFrame, [0, 15], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const scale = 1 + Math.sin((localFrame * Math.PI) / duration) * 0.05;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.bg,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            fontFamily: font.display,
            color: palette.accent,
            opacity: phraseOpacity,
            transform: `scale(${scale})`,
            textAlign: "center",
            padding: 60,
          }}
        >
          {phrase}
        </div>
      </div>
    );
  }

  // "card" or "overlay" style
  const bgBlur = interpolate(localFrame, [0, 15], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardOpacity = interpolate(localFrame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {backgroundAsset && (
        <div style={{ filter: `blur(${bgBlur}px)`, opacity: 0.6 }}>
          <img
            src={staticFile(resolveAsset(backgroundAsset))}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}
      {!backgroundAsset && (
        <div style={{ position: "absolute", inset: 0, backgroundColor: palette.bg }} />
      )}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          padding: 40,
          backgroundColor: "rgba(255,255,255,0.95)",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          opacity: cardOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: "bold",
            fontFamily: font.display,
            color: "#222",
            marginBottom: lines ? 20 : 0,
          }}
        >
          {phrase}
        </div>
        {lines?.map((line, i) => {
          const lineOpacity = interpolate(
            localFrame,
            [25 + i * 15, 40 + i * 15],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                opacity: lineOpacity,
                display: "flex",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              {line.icon && (
                <span style={{ color: line.color ?? palette.negative, fontSize: 36, marginRight: 15 }}>
                  {line.icon}
                </span>
              )}
              <span style={{ fontSize: 30, color: "#333", fontFamily: font.body }}>
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { Callout as Component };
