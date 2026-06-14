import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Slide } from "../Slide";
import { Chrome } from "../Chrome";
import { SplitText } from "../anim/SplitText";
import { useLifecycle } from "../anim/useLifecycle";
import { EasingPreset, resolveEasing } from "../utils/easing";
import { COLORS, FONT, TRACKING, TYPE_SCALE, WEIGHT } from "../utils/tokens";
import type { TextStyle } from "../utils/types";

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

export const BreakingNews: React.FC<BreakingNewsProps> = (props) => {
  const p = { ...breakingNewsDefaults, ...props };
  const frame = useCurrentFrame();
  const { exit } = useLifecycle({ delay: 0, inFrames: 1, holdFrames: 0, outFrames: 18 });
  const fade = 1 - exit;

  const chipProgress = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: resolveEasing(EasingPreset.CubicOut),
  });
  const timeOpacity =
    interpolate(frame, [12, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;
  const subOpacity =
    interpolate(frame, [60, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * fade;

  const dotOpacity = Math.floor(frame / 18) % 2 === 0 ? 1 : 0.35;
  const tickerProgress = (frame % p.tickerDurationFrames) / p.tickerDurationFrames;
  const tickerX = -50 * tickerProgress;

  const headStyle: TextStyle = {
    fontFamily: FONT.display,
    fontSize: TYPE_SCALE["4xl"],
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
    <Slide color={p.textColor}>
      <Chrome num={p.num} name={p.name} meta={p.meta} accent={p.accent} />

      <div
        style={{
          position: "absolute",
          top: 280,
          left: 180,
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
        }}
      >
        <span style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", opacity: dotOpacity }} />
        {p.chip}
      </div>

      <div
        style={{
          position: "absolute",
          top: 280,
          right: 180,
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

      <div style={{ position: "absolute", top: 380, left: 180, right: 180 }}>
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
          position: "absolute",
          top: 800,
          left: 180,
          right: 180,
          fontFamily: FONT.display,
          fontWeight: WEIGHT.medium,
          fontSize: 40,
          lineHeight: 1.3,
          color: p.secondaryColor,
          maxWidth: 1400,
          opacity: subOpacity,
        }}
      >
        {p.sub}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 96,
          background: "#0e0e12",
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
    </Slide>
  );
};
