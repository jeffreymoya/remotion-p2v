import React from "react";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { SplitText } from "../anim/SplitText";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, DISPLAY_SIZE, FONT, LEADING, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import type { TextStyle } from "../common/types";

export const titleCardSchema = z.object({
  num: z.string().describe("Pattern index shown in the chrome label, e.g. \"01\"."),
  name: z.string().describe("Chrome label naming this card pattern."),
  meta: z.string().describe("Top-right chrome caption."),
  eyebrow: z.string().describe("Kicker line above the title."),
  line1: z.string().describe("Primary display headline (uppercased)."),
  line2: z.string().describe("Secondary headline / subtitle."),
  metaItems: z.array(z.string()).describe("Bottom meta rail items."),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
  eyebrowSize: z.number().describe("Eyebrow font size in px."),
  line2Size: z.number().describe("Subtitle font size in px."),
});

export type TitleCardProps = Readonly<z.infer<typeof titleCardSchema>>;

export const titleCardDefaults: TitleCardProps = {
  num: "01",
  name: "Title Card",
  meta: "Episode Opener",
  eyebrow: "An Open Secrets Investigation · Episode 01",
  line1: "The Quiet Collapse",
  line2:
    "How three private banks erased $400 billion in seventy-two hours.",
  metaItems: ["Premieres 11.14.2025", "Dir. Mira Achebe", "Frontline · 90 Min."],
  accent: COLORS.orange,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.72)",
  mutedColor: COLORS.muted,
  eyebrowSize: DISPLAY_SIZE.eyebrow,
  line2Size: DISPLAY_SIZE.titleLine2,
};

import { defineMeta } from "../common/meta";

export const titleCardMeta = defineMeta({
  tier: "composite",
  category: "title",
  purpose: "Episode-opener hero title with eyebrow, two display lines, and a meta rail.",
  whenToUse: "Open a video or major section with a bold, branded title beat.",
  scriptCues: ["title", "opener", "intro", "hook", "headline", "cold open", "episode"],
  composes: ["Box", "SplitText", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/TitleCard.tsx",
});

export const TitleCard: React.FC<TitleCardProps> = (props) => {
  const p = { ...titleCardDefaults, ...props };
  const { h } = useBoxSize();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);

  const eyebrowOpacity = useFade(0, 14, exit);
  const metaOpacity = useFade(40, 56, exit);
  const barWidth = useFade(34, 60, exit);

  const line1Style: TextStyle = {
    fontFamily: FONT.display,
    fontSize: fitFont(h, 0.3, TYPE_SCALE["5xl"]),
    fontWeight: WEIGHT.extraBold,
    letterSpacing: TRACKING.display,
    lineHeight: 0.96,
    color: p.textColor,
    textTransform: "uppercase",
  };
  const line2Style: TextStyle = {
    fontFamily: FONT.display,
    fontSize: p.line2Size,
    fontWeight: WEIGHT.medium,
    letterSpacing: "0.005em",
    lineHeight: LEADING.tight,
    color: p.secondaryColor,
  };

  return (
    <Box
      style={{
        color: p.textColor,
        fontFamily: FONT.body,
        display: "flex",
        flexDirection: "column",
        padding: "6% 8%",
      }}
    >
      <div
        data-visual-role="hero-text"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: WEIGHT.medium,
            fontSize: p.eyebrowSize,
            letterSpacing: TRACKING.eyebrow,
            textTransform: "uppercase",
            color: p.mutedColor,
            marginBottom: "3%",
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            opacity: eyebrowOpacity,
          }}
        >
          <span style={{ width: 10, height: 10, background: p.accent, borderRadius: "50%" }} />
          {p.eyebrow}
        </div>

        <div>
          <SplitText
            segments={[{ text: p.line1 }]}
            style={line1Style}
            startFrame={6}
            inFrames={20}
            stagger={4}
            easing={EasingPreset.Smooth}
            transforms={{ y: 36, blur: 12 }}
            exit={exit}
          />
        </div>
        <div style={{ marginTop: "2.5%" }}>
          <SplitText
            segments={[{ text: p.line2 }]}
            style={line2Style}
            startFrame={20}
            inFrames={18}
            stagger={3}
            easing={EasingPreset.Smooth}
            transforms={{ y: 24, blur: 8 }}
            exit={exit}
          />
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            height: 1,
            width: `${barWidth * 100}%`,
            background: p.accent,
            marginBottom: 24,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 32,
            fontFamily: FONT.body,
            fontSize: TYPE_SCALE.xs,
            fontWeight: WEIGHT.medium,
            letterSpacing: TRACKING.meta,
            textTransform: "uppercase",
            color: p.mutedColor,
            opacity: metaOpacity,
          }}
        >
          {p.metaItems.map((item, i) => (
            <div key={i}>{item}</div>
          ))}
        </div>
      </div>
    </Box>
  );
};
