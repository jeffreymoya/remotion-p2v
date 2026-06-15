import React from "react";
import {
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { zTextSegment, zTheme } from "../common/schemas";
import { Box } from "../common/Box";
import { useBoxSize, fitFont } from "../common/layout-box";
import { Reveal } from "../anim/Reveal";
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
} from "../common/tokens";
import type { TextSegment } from "../common/types";

export const articleCardSchema = z.object({
  imageSrc: z.string(),
  category: z.string(),
  headline: z.array(zTextSegment),
  authors: z.array(z.string()),
  date: z.string(),
  source: z.string(),
  body: z.array(z.string()),
  theme: zTheme,
  accent: zColor(),
  markColor: zColor(),
  bgBlurPx: z.number(),
  scrimStrength: z.number(),
});

export type ArticleCardProps = z.infer<typeof articleCardSchema>;

export const articleCardDefaults: ArticleCardProps = {
  imageSrc: "",
  category: "Investigation",
  headline: [
    { text: "Three banks moved" },
    { text: "$400 billion", emphasis: true },
    { text: "in seventy-two hours." },
  ],
  authors: ["Mira Achebe", "R. Kade"],
  date: "14 March 2023",
  source: "Open Secrets",
  body: [
    "Internal ledgers reviewed by reporters show transfers routed through three shell entities before the markets opened.",
    "Each leg cleared in under an hour, leaving regulators a paper trail that began only after the money was gone.",
  ],
  theme: "dark",
  accent: COLORS.orange,
  markColor: COLORS.yellow,
  bgBlurPx: 24,
  scrimStrength: 0.45,
};

import { defineMeta } from "../common/meta";

export const articleCardMeta = defineMeta({
  tier: "composite",
  category: "document",
  purpose: "Article/newspaper macro layout.",
  whenToUse: "Present press coverage or a publication as evidence.",
  scriptCues: ["article", "newspaper", "press", "publication", "clipping", "report", "story"],
  composes: ["Box", "Reveal", "useFade", "useLifecycle"],
  canonicalExample: "src/components/docu/scenes/ArticleCard.tsx",
});

const HIGHLIGHT_BASE = 15;
const HIGHLIGHT_STRIDE = 8;

/**
 * Full-frame magazine article card over a blurred photo: category, headline
 * with marker-highlighted terms, byline and a blurred body. Ported from
 * `ArticleCard` but self-contained — no canvas text measurement or roughjs;
 * highlights use the shared `Reveal` primitive and the image is a prop.
 */
export const ArticleCard: React.FC<ArticleCardProps> = (props) => {
  const p = { ...articleCardDefaults, ...props };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { exit, opacity } = useLifecycle(DEFAULT_LIFECYCLE);
  const t = resolveTheme(p.theme);
  const isDark = p.theme === "dark";

  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);
  const rotateY = interpolate(progress, [0, 1], [-8, 8]);
  const rotateX = interpolate(progress, [0, 1], [-3, 3]);

  const categoryOpacity = useFade(0, 14, exit);
  const bylineOpacity = useFade(15, 30, exit);
  const bodyOpacity = useFade(30, 48, exit);

  const { h } = useBoxSize();
  const headlineSize = fitFont(h, 0.1, TYPE_SCALE.xl);

  let emphasisIndex = 0;

  const scrim = isDark
    ? `radial-gradient(ellipse at center, rgba(0,0,0,${p.scrimStrength * 0.6}) 0%, rgba(0,0,0,${p.scrimStrength}) 100%)`
    : `radial-gradient(ellipse at center, rgba(255,255,255,${p.scrimStrength * 0.6}) 0%, rgba(255,255,255,${p.scrimStrength}) 100%)`;

  const byline = [p.authors.slice(0, 2).join(", "), p.date, p.source]
    .filter(Boolean)
    .join("  |  ");

  return (
    <Box dataVisualRole="document">
      {p.imageSrc ? (
        <Img
          src={p.imageSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${p.bgBlurPx}px)` }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: COLORS.bg2 }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: scrim }} />

      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 6%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
            willChange: "transform",
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: TYPE_SCALE.xs,
              fontWeight: WEIGHT.bold,
              color: p.accent,
              textTransform: "uppercase",
              letterSpacing: TRACKING.label,
              marginBottom: 20,
              opacity: categoryOpacity,
            }}
          >
            {p.category}
          </div>

          <div
            style={{
              fontFamily: FONT.serif,
              fontSize: headlineSize,
              fontWeight: WEIGHT.bold,
              lineHeight: LEADING.snug,
              color: t.text,
              textShadow: isDark ? SHADOW.text : "none",
            }}
          >
            {p.headline.map((seg: TextSegment, i) => {
              if (!seg.emphasis) return <span key={i}>{seg.text} </span>;
              const start = HIGHLIGHT_BASE + emphasisIndex * HIGHLIGHT_STRIDE;
              emphasisIndex += 1;
              return (
                <Reveal
                  key={i}
                  variant="highlight"
                  color={p.markColor}
                  startFrame={start}
                  durFrames={24}
                  exit={exit}
                >
                  <span style={{ color: isDark ? COLORS.ink : t.text }}>{seg.text}</span>
                </Reveal>
              );
            })}
          </div>

          <div
            style={{
              fontFamily: FONT.body,
              fontSize: TYPE_SCALE.xs,
              fontWeight: WEIGHT.regular,
              color: t.muted,
              marginTop: 28,
              opacity: bylineOpacity,
            }}
          >
            {byline}
          </div>

          <div
            style={{
              height: BORDER.hairline,
              background: t.muted,
              opacity: bylineOpacity * 0.5,
              margin: "20px 0 24px",
            }}
          />

          {p.body.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONT.body,
                fontSize: TYPE_SCALE.xs,
                fontWeight: WEIGHT.regular,
                color: t.muted,
                lineHeight: LEADING.loose,
                filter: "blur(1.5px)",
                opacity: bodyOpacity * 0.7,
                marginBottom: 8,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};
