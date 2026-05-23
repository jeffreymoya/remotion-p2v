import React from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { FONT_BODY, FONT_DISPLAY } from "./docu-tokens"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { HEADLINE_LAYOUT_OPTS, CARD_SCALE } from "../../lib/docu/article-text-layout";

const { fontFamily: interFamily } = loadFont();

// All font sizes and spacing values are scaled from the original 900×500 baseline
// so the card layout stays proportional at any card size.
const CATEGORY_FONT_SIZE = Math.round(13 * CARD_SCALE);
const CATEGORY_COLOR = "#FF6B00";
const BYLINE_FONT_SIZE = Math.round(14 * CARD_SCALE);
const BODY_FONT_SIZE = Math.round(15 * CARD_SCALE);
const BODY_BLUR = Math.round(1.5 * CARD_SCALE);

/**
 * Rule: dark-mode text (near-black headline) → bright white overlay behind card
 *       light-mode text (white headline)     → dark overlay behind card
 * This record provides all per-mode color tokens from a single lookup.
 */
const TEXT_PALETTE = {
  light: {
    headline:  "#ffffff",
    shadow:    "0 2px 6px rgba(0,0,0,0.55)",
    byline:    "rgba(255,255,255,0.7)",
    divider:   "rgba(255,255,255,0.3)",
    body:      "rgba(255,255,255,0.45)",
  },
  dark: {
    headline:  "#0a0a0a",
    shadow:    "0 2px 8px rgba(255,255,255,0.45)",
    byline:    "rgba(0,0,0,0.65)",
    divider:   "rgba(0,0,0,0.25)",
    body:      "rgba(0,0,0,0.4)",
  },
} as const;

const BODY_LINES = [
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi.",
];

export interface ArticleCardLayoutProps {
  category: string;
  headline: string;
  authors: string[];
  date: string;
  time: string;
  tz: string;
  source: string;
  displayWidth?: number;
  numHeadlineLines?: number;
  /** Match the textMode on ArticleCard — drives headline color and shadow. */
  textMode?: "light" | "dark";
}

export const ArticleCardLayout: React.FC<ArticleCardLayoutProps> = ({
  category,
  headline,
  authors,
  date,
  time,
  tz,
  source,
  displayWidth = HEADLINE_LAYOUT_OPTS.containerWidth,
  numHeadlineLines = 1,
  textMode = "light",
}) => {
  const palette = TEXT_PALETTE[textMode];
  const padLeft = HEADLINE_LAYOUT_OPTS.padLeft;
  const headlineTop = HEADLINE_LAYOUT_OPTS.headlineTop;
  const headlineFontSize = HEADLINE_LAYOUT_OPTS.fontSize;
  const headlineFontWeight = HEADLINE_LAYOUT_OPTS.fontWeight;
  const headlineFontFamily = HEADLINE_LAYOUT_OPTS.fontFamily;
  const headlineLineHeight = HEADLINE_LAYOUT_OPTS.lineHeight;

  const categoryTop = headlineTop - CATEGORY_FONT_SIZE - 16;
  // Account for multi-line headlines: shift byline below the last headline line
  const headlineBlockHeight = numHeadlineLines * headlineLineHeight;
  const bylineTop = headlineTop + headlineBlockHeight + 8;
  const dividerTop = bylineTop + BYLINE_FONT_SIZE + 12;
  const bodyTop = dividerTop + 16;

  const bylineText = [authors.slice(0, 2).join(", "), date, source]
    .filter(Boolean)
    .join(" | ");

  return (
    <div
      style={{
        width: displayWidth,
        height: "100%",
        position: "relative",
        background: "transparent",
        overflow: "hidden",
        fontFamily: interFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: padLeft,
          top: categoryTop,
          fontSize: CATEGORY_FONT_SIZE,
          fontWeight: 700,
          color: CATEGORY_COLOR,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          fontFamily: interFamily,
        }}
      >
        {category}
      </div>

      <div
        style={{
          position: "absolute",
          left: padLeft,
          top: headlineTop,
          // Explicit width keeps DOM line-wrapping in sync with the canvas layout
          // in layoutHeadline (which uses containerWidth as its wrap boundary).
          width: displayWidth - padLeft,
          fontSize: headlineFontSize,
          fontWeight: headlineFontWeight,
          fontFamily: headlineFontFamily,
          color: palette.headline,
          lineHeight: `${headlineLineHeight}px`,
          // Enables Chromium's full kerning/ligature pass — measurably crisper
          // on large serif headlines.  The two macOS-only smoothing properties
          // (-webkit-font-smoothing, -moz-osx-font-smoothing) have zero effect
          // in headless Chromium renders.
          textRendering: "optimizeLegibility",
          // Drop shadow direction inverts with textMode so it always recedes
          // away from the text (dark shadow for light text, light glow for dark text).
          textShadow: palette.shadow,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          position: "absolute",
          left: padLeft,
          top: bylineTop,
          fontSize: BYLINE_FONT_SIZE,
          fontWeight: 400,
          color: palette.byline,
          fontFamily: interFamily,
        }}
      >
        {bylineText}
      </div>

      <div
        style={{
          position: "absolute",
          left: padLeft,
          top: dividerTop,
          width: displayWidth - padLeft * 2,
          height: 1,
          background: palette.divider,
        }}
      />

      {BODY_LINES.map((line, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: padLeft,
            top: bodyTop + i * (BODY_FONT_SIZE * 1.7),
            width: displayWidth - padLeft * 2,
            fontSize: BODY_FONT_SIZE,
            fontWeight: 400,
            color: palette.body,
            fontFamily: interFamily,
            lineHeight: 1.7,
            filter: `blur(${BODY_BLUR}px)`,
            userSelect: "none",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};
