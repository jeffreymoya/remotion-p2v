import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { SplitText } from "../anim/SplitText";
import { useFade } from "../anim/useFade";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../common/easing";
import { COLORS, DEFAULT_LIFECYCLE, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../common/tokens";
import type { TextStyle } from "../common/types";

const tickerItem = z.object({
  symbol: z.string(),
  value: z.string(),
  change: z.string(),
  direction: z.enum(["up", "down"]),
});

export const breakingNewsSchema = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
  chip: z.string(),
  time: z.string(),
  headline: z.string(),
  sub: z.string(),
  tickerTag: z.string(),
  ticker: z.array(tickerItem),
  tickerDurationFrames: z.number(),
  accent: zColor(),
  textColor: zColor(),
  secondaryColor: zColor(),
  mutedColor: zColor(),
});

export type BreakingNewsProps = z.infer<typeof breakingNewsSchema>;

export const breakingNewsDefaults: BreakingNewsProps = {
  num: "08",
  name: "Breaking News + Ticker",
  meta: "Newsroom Pickup",
  chip: "Breaking",
  time: "Live · 09:42 ET · NYSE Halts Trading",
  headline: "Helix Capital collapses in pre-market trading",
  sub: "Bank's three largest counterparties suspend exposure. Federal Reserve confirms emergency liquidity facility opened at 06:00 ET.",
  tickerTag: "Markets",
  ticker: [
    { symbol: "HLX", value: "42.18", change: "−61.4%", direction: "down" },
    { symbol: "JPM", value: "184.22", change: "−2.8%", direction: "down" },
    { symbol: "GS", value: "411.07", change: "−3.4%", direction: "down" },
    { symbol: "BAC", value: "36.92", change: "−4.1%", direction: "down" },
    { symbol: "VIX", value: "38.74", change: "+44.7%", direction: "up" },
    { symbol: "GLD", value: "234.10", change: "+1.9%", direction: "up" },
    { symbol: "DXY", value: "104.61", change: "+0.6%", direction: "up" },
    { symbol: "10Y", value: "4.18", change: "−18bp", direction: "down" },
  ],
  tickerDurationFrames: 840,
  accent: COLORS.red,
  textColor: COLORS.fg,
  secondaryColor: "rgba(239,233,220,0.66)",
  mutedColor: COLORS.muted,
};

import { defineMeta } from "../common/meta";

export const breakingNewsMeta = defineMeta({
  tier: "composite",
  category: "headline",
  purpose: "Urgent breaking-news banner with ticker.",
  whenToUse: "Open on alarm, urgency, or a news-bulletin framing.",
  scriptCues: ["breaking", "urgent", "alert", "news", "bulletin", "alarm", "just in"],
  composes: ["Box", "SplitText", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/cards/BreakingNews.tsx",
});

export const BreakingNews: React.FC<BreakingNewsProps> = (props) => {
  const p = { ...breakingNewsDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle(DEFAULT_LIFECYCLE);
  const fade = 1 - exit;

  const chipProgress = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.CubicOut),
  });
  const timeOpacity = useFade(12, 26, exit);
  const subOpacity = useFade(60, 76, exit);

  const dotOpacity = Math.floor(frame / 18) % 2 === 0 ? 1 : 0.35;
  const tickerProgress = (frame % p.tickerDurationFrames) / p.tickerDurationFrames;
  const tickerX = -50 * tickerProgress;

  const { h } = useBoxSize();
  const headSize = fitFont(h, 0.16, TYPE_SCALE["4xl"]);
  const subSize = fitFont(h, 0.05, 40);

  const headStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: headSize,
    fontWeight: WEIGHT.extraBold,
    letterSpacing: "-0.018em",
    lineHeight: 1.0,
    color: p.textColor,
    textTransform: "uppercase",
  };

  const renderTickerRun = (keyPrefix: string): React.ReactNode =>
    p.ticker.map((item, i) => (
      <span key={`${keyPrefix}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 18 }}>
        <span style={{ color: p.mutedColor, fontWeight: WEIGHT.bold, letterSpacing: "0.18em" }}>{item.symbol}</span>
        {item.value}
        <span style={{ color: item.direction === "up" ? COLORS.green : COLORS.red, fontWeight: WEIGHT.bold }}>
          {item.direction === "up" ? "▲" : "▼"}
          {item.change}
        </span>
      </span>
    ));

  return (
    <Box style={{ color: p.textColor, fontFamily: FONT.body, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "6% 8% 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              padding: "18px 30px 18px 22px",
              background: p.accent,
              color: "#fff",
              fontFamily: FONT.body,
              fontWeight: WEIGHT.black,
              fontSize: 40,
              letterSpacing: TRACKING.kicker,
              textTransform: "uppercase",
              opacity: chipProgress * fade,
              transform: `scale(${0.9 + 0.1 * chipProgress})`,
              flexShrink: 0,
            }}
          >
            <span style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", opacity: dotOpacity }} />
            {p.chip}
          </div>

          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: WEIGHT.medium,
              fontSize: TYPE_SCALE.xs,
              letterSpacing: TRACKING.label,
              textTransform: "uppercase",
              color: p.mutedColor,
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: timeOpacity,
            }}
          >
            <span style={{ width: 10, height: 10, background: COLORS.green, borderRadius: "50%" }} />
            {p.time}
          </div>
        </div>

        <div
          data-visual-role="hero-text"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <SplitText
            segments={[{ text: p.headline }]}
            style={headStyle}
            startFrame={20}
            inFrames={16}
            stagger={2}
            easing={EasingPreset.Smooth}
            transforms={{ y: 28, blur: 8 }}
            exit={exit}
          />
        </div>

        <div
          style={{
            marginBottom: "3%",
            fontFamily: FONT.display,
            fontWeight: WEIGHT.medium,
            fontSize: subSize,
            lineHeight: 1.3,
            color: p.secondaryColor,
            opacity: subOpacity,
          }}
        >
          {p.sub}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          height: 96,
          background: COLORS.bg,
          borderTop: `1px solid rgba(214,54,46,0.4)`,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          opacity: fade,
        }}
      >
        <div
          style={{
            background: p.accent,
            color: "#fff",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 36px",
            fontFamily: FONT.body,
            fontWeight: WEIGHT.black,
            fontSize: 26,
            letterSpacing: TRACKING.meta,
            textTransform: "uppercase",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          {p.tickerTag}
        </div>
        <div
          style={{
            display: "flex",
            gap: 60,
            paddingLeft: 60,
            fontFamily: FONT.body,
            fontSize: 26,
            fontWeight: WEIGHT.medium,
            letterSpacing: "0.08em",
            color: p.textColor,
            whiteSpace: "nowrap",
            transform: `translateX(${tickerX}%)`,
          }}
        >
          {renderTickerRun("a")}
          {renderTickerRun("b")}
        </div>
      </div>
    </Box>
  );
};
