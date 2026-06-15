import { staticFile } from "remotion";
import type { ArticleData } from "../../lib/docu/article-pipeline";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import type { Theme, TextSegment } from "./common/types";
import type { DocuPalette } from "./docu-tokens";
import { PALETTE_MAP } from "./docu-tokens";

export function paletteToTheme(palette: DocuPalette): Theme {
  return palette === "warm-real" ? "light" : "dark";
}

export function paletteToAccent(palette: DocuPalette): string {
  return PALETTE_MAP[palette].accentColor;
}

export function toStaticSrc(filePath?: string): string {
  if (!filePath) {
    return "";
  }
  const normalized = filePath.replace(/^\/?public\//, "").replace(/^\//, "");
  return staticFile(normalized);
}

export function toHeadlineSegments(headline: string): TextSegment[] {
  return [{ text: headline }];
}

export function toArticleBody(article: ArticleData): string[] {
  const lines = [
    article.authors.length > 0 ? `By ${article.authors.join(", ")}` : "",
    [article.date, article.time, article.tz].filter(Boolean).join(" · "),
  ].filter(Boolean);
  return lines.length > 0 ? lines : [article.source];
}

export function kineticDisplay(value: number, unit: OverlayUnit): {
  currency: string;
  target: number;
  unit: string;
  decimals: number;
} {
  switch (unit) {
    case "$":
      return { currency: "$", target: value, unit: "", decimals: 0 };
    case "%":
      return { currency: "", target: value, unit: "%", decimals: 2 };
    case "x":
      return { currency: "", target: value, unit: "x", decimals: 1 };
    case "T":
    case "B":
      return {
        currency: "$",
        target: value,
        unit,
        decimals: Number.isInteger(value) ? 0 : 1,
      };
    case "M":
      return {
        currency: "",
        target: value,
        unit: "M",
        decimals: Number.isInteger(value) ? 0 : 1,
      };
    case "K":
      return { currency: "", target: value, unit: "K", decimals: 0 };
  }
}
