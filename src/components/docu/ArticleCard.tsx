import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ArticleHighlights } from "./ArticleHighlights";
import type { HighlightBbox } from "./ArticleHighlights";
import { ArticleCardLayout } from "./ArticleCardLayout";
import type { ArticleData } from "../../lib/docu/article-pipeline";
import { layoutHeadline, HEADLINE_LAYOUT_OPTS, CARD_HEIGHT } from "../../lib/docu/article-text-layout";

export type { HighlightBbox } from "./ArticleHighlights";

export interface ArticleCardProps {
  article: ArticleData;
  bgImageFile: string;
  bgBlurPx?: number;
  /** Opacity strength of the background overlay (0–1). Default 0.45. */
  bgOverlayStrength?: number;
  /**
   * Controls text color and overlay tint direction.
   * - "light" (default): white headline, dark overlay → text pops on dark BG
   * - "dark": near-black headline, bright overlay → text pops on bright/washed-out BG
   */
  textMode?: "light" | "dark";
  displayWidth?: number;
  durationInFrames: number;
  enterFrame?: number;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  bgImageFile,
  bgBlurPx = 24,
  bgOverlayStrength = 0.45,
  textMode = "light",
  displayWidth = HEADLINE_LAYOUT_OPTS.containerWidth,
  durationInFrames,
  enterFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - enterFrame;

  const highlightBboxes: HighlightBbox[] = useMemo(
    () => layoutHeadline(article.headline, HEADLINE_LAYOUT_OPTS),
    [article.headline],
  );

  // Count distinct headline lines so ArticleCardLayout can position byline correctly
  const numHeadlineLines = useMemo(() => {
    if (highlightBboxes.length === 0) return 1;
    const uniqueTops = new Set(highlightBboxes.map((b) => b.top));
    return Math.max(1, uniqueTops.size);
  }, [highlightBboxes]);

  const progress = localFrame / durationInFrames;
  const rotateY = interpolate(progress, [0, 1], [-8, 8]);
  const rotateX = interpolate(progress, [0, 1], [-3, 3]);
  // No animated scale — scaling during a 3D transform forces the text layer
  // to be re-rasterized every frame, causing jagged edges in preview and
  // sub-pixel fringes in the rendered output.
  const cardScale = 1;

  const opacity = interpolate(
    localFrame,
    [0, 15, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const highlightProgress = interpolate(
    localFrame,
    [15, 45],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const highlightClipWidth = highlightProgress * displayWidth;

  const threeDTransform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${cardScale})`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill>
        <Img
          src={staticFile(bgImageFile)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `blur(${bgBlurPx}px)`,
          }}
        />
      </AbsoluteFill>

      {/* Overlay tint — dark for light-mode text, bright for dark-mode text.
          Dark mode gets slightly extra blur (+6 px) to suppress hot-spot bleed
          through a bright/white overlay. */}
      <AbsoluteFill
        style={{
          background: textMode === "dark"
            ? `radial-gradient(ellipse at center, rgba(255,255,255,${bgOverlayStrength * 0.6}) 0%, rgba(255,255,255,${bgOverlayStrength}) 100%)`
            : `radial-gradient(ellipse at center, rgba(0,0,0,${bgOverlayStrength * 0.6}) 0%, rgba(0,0,0,${bgOverlayStrength}) 100%)`,
          backdropFilter: textMode === "dark" ? `blur(${Math.round(bgBlurPx * 0.25)}px)` : undefined,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            gridArea: "1 / 1",
            width: displayWidth,
            height: CARD_HEIGHT,
            transform: threeDTransform,
            // Promote to its own compositor layer so text is rasterised once
            // at full resolution rather than re-rasterised on every rotate frame.
            willChange: "transform",
            backfaceVisibility: "hidden",
            opacity,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Highlights render BEHIND the text so the white headline sits on top
              of the yellow rectangles (not underneath them). This also keeps the
              drop shadow on the text visible under the highlight. */}
          <ArticleHighlights
            bboxes={highlightBboxes}
            width={displayWidth}
            height={CARD_HEIGHT}
            clipWidth={highlightClipWidth}
            opacity={1}
          />
          <ArticleCardLayout
            category={article.category}
            headline={article.headline}
            authors={article.authors}
            date={article.date}
            time={article.time}
            tz={article.tz}
            source={article.source}
            displayWidth={displayWidth}
            numHeadlineLines={numHeadlineLines}
            textMode={textMode}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
