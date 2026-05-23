import React, { useEffect, useLayoutEffect, useRef } from "react";
import { continueRender, delayRender } from "remotion";
import rough from "roughjs";
import { CARD_SCALE, HEADLINE_LAYOUT_OPTS } from "../../lib/docu/article-text-layout";

// Derive padY from the line-box half-leading so highlight rects never bleed
// into the neighbouring line.  halfLeading = (lineHeight − fontSize) / 2 ≈ 13 px
// at the 1494-px card size.  Subtracting 2 keeps a 2-px safety margin.
const HEADLINE_HALF_LEADING =
  (HEADLINE_LAYOUT_OPTS.lineHeight - HEADLINE_LAYOUT_OPTS.fontSize) / 2;
const HIGHLIGHT_PAD_Y = Math.max(2, Math.floor(HEADLINE_HALF_LEADING) - 2);
const HIGHLIGHT_PAD_X = Math.round(6 * CARD_SCALE);

export interface HighlightBbox {
  word: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ArticleHighlightsProps {
  bboxes: HighlightBbox[];
  width: number;
  height: number;
  clipWidth: number;
  opacity?: number;
}

/**
 * Group word-level bboxes into visual lines.
 * Two bboxes belong to the same line when their Y-intervals overlap.
 */
function groupIntoLines(bboxes: HighlightBbox[]): HighlightBbox[][] {
  if (bboxes.length === 0) return [];
  const sorted = [...bboxes].sort((a, b) =>
    a.top !== b.top ? a.top - b.top : a.left - b.left,
  );
  const lines: HighlightBbox[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const b = sorted[i];
    const line = lines[lines.length - 1];
    const lineBottom = Math.max(...line.map((w) => w.top + w.height));
    // Same line if this bbox starts before the current line's bottom
    if (b.top < lineBottom) {
      line.push(b);
    } else {
      lines.push([b]);
    }
  }
  return lines;
}

/**
 * Merge a line of word bboxes into a single spanning highlight rect.
 * padX/padY add breathing room so the highlight feels like a real marker.
 * padY is bounded by the line-box half-leading so rects never bleed into
 * neighbouring lines (see HIGHLIGHT_PAD_Y derivation above).
 */
function mergeLineToSpan(
  words: HighlightBbox[],
  padX = HIGHLIGHT_PAD_X,
  padY = HIGHLIGHT_PAD_Y,
): { left: number; top: number; width: number; height: number } {
  const left = Math.min(...words.map((w) => w.left)) - padX;
  const top = Math.min(...words.map((w) => w.top)) - padY;
  const right = Math.max(...words.map((w) => w.left + w.width)) + padX;
  const bottom = Math.max(...words.map((w) => w.top + w.height)) + padY;
  return { left, top, width: right - left, height: bottom - top };
}

export const ArticleHighlights: React.FC<ArticleHighlightsProps> = ({
  bboxes,
  width,
  height,
  clipWidth,
  opacity = 1,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const hasDrawnRef = useRef(false);
  const handleRef = useRef<number | null>(null);

  if (!hasDrawnRef.current) {
    handleRef.current = delayRender();
  }

  useLayoutEffect(() => {
    if (!hasDrawnRef.current && svgRef.current && gRef.current) {
      const rc = rough.svg(svgRef.current);
      const g = gRef.current;

      // One spanning rect per line — clean marker look, no fragmented per-word rects.
      const lines = groupIntoLines(bboxes);
      lines.forEach((line, i) => {
        const span = mergeLineToSpan(line);
        const rect = rc.rectangle(span.left, span.top, span.width, span.height, {
          fill: "rgba(255, 220, 50, 0.75)",
          fillStyle: "solid",
          roughness: 0.6,
          seed: i + 1,
          stroke: "none",
        });
        g.appendChild(rect);
      });

      hasDrawnRef.current = true;
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    }
  }, [bboxes]);

  useEffect(() => {
    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, []);

  const clipId = useRef(
    `ac-hl-${Math.random().toString(36).slice(2, 9)}`,
  ).current;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        opacity,
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={clipWidth} height={height} />
        </clipPath>
      </defs>
      <g ref={gRef} clipPath={`url(#${clipId})`} />
    </svg>
  );
};
