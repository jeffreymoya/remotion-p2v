import type { HighlightBbox } from "../../components/docu/ArticleHighlights";

export type { HighlightBbox } from "../../components/docu/ArticleHighlights";

// ─── Card dimensions — single source of truth ────────────────────────────────
// Target: 60 % of total 1920×1080 viewport area at a 1.8 : 1 aspect ratio.
//   √(1920 × 1080 × 0.60 × 1.8) ≈ 1494   →   height = 1494 / 1.8 ≈ 830
export const CARD_WIDTH = 1494;
export const CARD_ASPECT = 1.8; // width : height
export const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT); // 830

// All pixel values below were originally tuned for a 900 × 500 card.
// `scale` converts them to the current card size so proportions are preserved.
const BASE_WIDTH = 900;
export const CARD_SCALE = CARD_WIDTH / BASE_WIDTH; // ~1.66

// ─── Headline layout ──────────────────────────────────────────────────────────
export interface HeadlineLayoutOpts {
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  containerWidth: number;
  padLeft: number;
  headlineTop: number;
  lineHeight: number;
}

export const HEADLINE_LAYOUT_OPTS: HeadlineLayoutOpts = {
  fontSize:       Math.round(42  * CARD_SCALE), // ~70 px
  fontWeight:     "700",
  fontFamily:     "Georgia, serif",
  containerWidth: CARD_WIDTH,
  padLeft:        Math.round(40  * CARD_SCALE), // ~66 px
  headlineTop:    Math.round(120 * CARD_SCALE), // ~199 px
  lineHeight:     Math.round(58  * CARD_SCALE), // ~96 px
};

// ─── Word measurement ─────────────────────────────────────────────────────────
function measureWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  fontWeight: string,
  fontSize: number,
  fontFamily: string,
): { width: number; ascent: number; descent: number } {
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(word);
  return {
    width: metrics.width,
    ascent: metrics.actualBoundingBoxAscent,
    descent: metrics.actualBoundingBoxDescent,
  };
}

// ─── Headline bbox layout ─────────────────────────────────────────────────────
export function layoutHeadline(
  headline: string,
  opts: HeadlineLayoutOpts,
): HighlightBbox[] {
  if (typeof document === "undefined") return [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const words = headline.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const { fontSize, fontWeight, fontFamily, containerWidth, padLeft, headlineTop, lineHeight } = opts;

  // First pass: distribute words into lines
  const lines: number[][] = [];
  let currentLine: number[] = [];
  let x = padLeft;

  for (let i = 0; i < words.length; i++) {
    const spaceWidth = currentLine.length > 0
      ? measureWord(ctx, " ", fontWeight, fontSize, fontFamily).width
      : 0;
    const { width } = measureWord(ctx, words[i], fontWeight, fontSize, fontFamily);

    if (currentLine.length > 0 && x + spaceWidth + width > containerWidth) {
      lines.push(currentLine);
      currentLine = [i];
      x = padLeft + width;
    } else {
      if (currentLine.length > 0) x += spaceWidth;
      x += width;
      currentLine.push(i);
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  // Second pass: compute bboxes
  // Vertical positioning uses CSS line-box geometry — avoids the mismatch between
  // canvas actualBoundingBoxAscent and the font's declared ascender used by CSS.
  //
  //   Line box N starts at:    headlineTop + N × lineHeight
  //   em-square top (half-leading): + (lineHeight − fontSize) / 2
  //   ⟹ bboxTop = headlineTop + N × lineHeight + (lineHeight − fontSize) / 2
  //
  // Horizontal widths still come from canvas — accurate regardless of the
  // canvas / CSS vertical metric difference.
  const halfLeading = (lineHeight - fontSize) / 2;
  const bboxes: HighlightBbox[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const wordIndices = lines[lineIdx];
    const lineBboxTop    = headlineTop + lineIdx * lineHeight + halfLeading;
    const lineBboxHeight = fontSize; // padY in mergeLineToSpan adds breathing room

    let lx = padLeft;
    for (let k = 0; k < wordIndices.length; k++) {
      const wi = wordIndices[k];
      if (k > 0) lx += measureWord(ctx, " ", fontWeight, fontSize, fontFamily).width;
      const { width } = measureWord(ctx, words[wi], fontWeight, fontSize, fontFamily);
      bboxes.push({ word: words[wi], left: lx, top: lineBboxTop, width, height: lineBboxHeight });
      lx += width;
    }
  }

  return bboxes;
}
