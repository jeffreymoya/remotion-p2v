import React from "react";
import { Img } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { zTheme } from "../common/schemas";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { KenBurns } from "../anim/KenBurns";
import { SplitText } from "../anim/SplitText";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import {
  BORDER,
  COLORS,
  DEFAULT_LIFECYCLE,
  FONT,
  LEADING,
  resolveTheme,
  SHADOW,
  TRACKING,
  TYPE_SCALE,
  WEIGHT,
  textStyle,
} from "../common/tokens";

export const splitCardSchema = z.object({
  imageSrc: z.string(),
  institution: z.string(),
  headline: z.string(),
  cite: z.string().optional(),
  theme: zTheme,
  accent: zColor(),
  shotIndex: z.number(),
  panelScrim: z.string(),
});

export type SplitCardProps = z.infer<typeof splitCardSchema>;

export const splitCardDefaults: SplitCardProps = {
  imageSrc: "",
  institution: "Federal Reserve",
  headline: "Liquidity guarantees were never funded.",
  cite: "Testimony · Senate Banking Committee, 2024",
  theme: "dark",
  accent: COLORS.orange,
  shotIndex: 0,
  panelScrim: "linear-gradient(to right, rgba(11,11,13,0.55), rgba(11,11,13,0.35))",
};

import { defineMeta } from "../common/meta";

export const splitCardMeta = defineMeta({
  tier: "composite",
  category: "comparison",
  purpose: "Split-screen comparison of two sides.",
  whenToUse: "Contrast two things side by side (versus, before/after).",
  scriptCues: ["versus", "vs", "split", "compare", "comparison", "on the other hand", "contrast"],
  composes: ["Box", "KenBurns", "SplitText", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/scenes/SplitCard.tsx",
});

/**
 * 50/50 image + text scene. Ported from `DocuSplitCard`: `DocuKenBurns` →
 * `KenBurns`, `AnimatedText` → `SplitText`, palette → theme tokens. The image
 * source is a prop, so callers pass `staticFile(...)` or any URL.
 */
export const SplitCard: React.FC<SplitCardProps> = (props) => {
  const p = { ...splitCardDefaults, ...props };
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const t = resolveTheme(p.theme);
  const citeOpacity = useFade(20, 32, exit);
  const { h } = useBoxSize();
  const instSize = fitFont(h, 0.08, TYPE_SCALE.lg);
  const headlineSize = fitFont(h, 0.065, TYPE_SCALE.md);

  return (
    <Box dataVisualRole="document" style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ flex: "0 0 50%", overflow: "hidden" }}>
        <KenBurns shotIndex={p.shotIndex}>
          {p.imageSrc ? (
            <Img src={p.imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: COLORS.bg2 }} />
          )}
        </KenBurns>
      </div>

      <div
        style={{
          flex: "0 0 50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "10% 7% 10% 8%",
          background: p.panelScrim,
          borderLeft: `${BORDER.accentBar}px solid ${p.accent}`,
        }}
      >
        <div style={{ marginBottom: 24, textShadow: SHADOW.panel }}>
          <SplitText
            segments={[{ text: p.institution }]}
            style={textStyle({
              fontFamily: FONT.display,
              fontSize: instSize,
              fontWeight: WEIGHT.bold,
              letterSpacing: TRACKING.body,
              lineHeight: LEADING.tight,
              color: p.accent,
            })}
            startFrame={0}
            inFrames={16}
            stagger={2}
            transforms={{ y: 16 }}
            exit={exit}
          />
        </div>

        <div style={{ marginBottom: 28, textShadow: SHADOW.panel }}>
          <SplitText
            segments={[{ text: p.headline }]}
            style={textStyle({
              fontFamily: FONT.display,
              fontSize: headlineSize,
              fontWeight: WEIGHT.medium,
              lineHeight: LEADING.snug,
              color: t.text,
            })}
            startFrame={10}
            inFrames={18}
            stagger={2}
            transforms={{ y: 20, blur: 8 }}
            exit={exit}
          />
        </div>

        {p.cite ? (
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: TYPE_SCALE.xs,
              fontWeight: WEIGHT.light,
              color: t.muted,
              letterSpacing: TRACKING.wide,
              lineHeight: LEADING.tight,
              opacity: citeOpacity,
            }}
          >
            {p.cite}
          </div>
        ) : null}
      </div>
    </Box>
  );
};
