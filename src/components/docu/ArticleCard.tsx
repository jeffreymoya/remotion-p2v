import React from "react";
import { AbsoluteFill } from "remotion";
import { ArticleCard as S2vArticleCard } from "./scenes/ArticleCard";
import type { ArticleData } from "../../lib/docu/article-pipeline";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";
import { toArticleBody, toHeadlineSegments, toStaticSrc } from "./s2v-adapters";

export interface HighlightBbox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ArticleCardProps {
  article: ArticleData;
  bgImageFile: string;
  bgBlurPx?: number;
  bgOverlayStrength?: number;
  textMode?: "light" | "dark";
  displayWidth?: number;
  durationInFrames: number;
  enterFrame?: number;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  bgImageFile,
  bgBlurPx = 24,
  bgOverlayStrength = 0.45,
  textMode = "light",
  displayWidth: _displayWidth,
  durationInFrames: _durationInFrames,
  enterFrame: _enterFrame,
  enter: _enter,
}) => {
  return (
    <AbsoluteFill>
      <S2vArticleCard
        imageSrc={toStaticSrc(bgImageFile)}
        category={article.category}
        headline={toHeadlineSegments(article.headline)}
        authors={article.authors}
        date={[article.date, article.time, article.tz].filter(Boolean).join(" · ") || article.date}
        source={article.source}
        body={toArticleBody(article)}
        theme={textMode === "dark" ? "light" : "dark"}
        accent="#D97757"
        markColor="#f4c84a"
        bgBlurPx={bgBlurPx}
        scrimStrength={bgOverlayStrength}
      />
    </AbsoluteFill>
  );
};
