import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EasingPreset, resolveEasing } from "../utils/easing";
import type { SplitMode, SplitTransforms, TextSegment, TextStyle } from "../utils/types";

const DEFAULT_TRANSFORMS: SplitTransforms = {
  opacityFrom: 0,
  y: 24,
  blur: 0,
  scale: 1,
};

export interface SplitTextProps {
  segments: TextSegment[];
  style: TextStyle;
  mode?: SplitMode;
  startFrame?: number;
  inFrames?: number;
  stagger?: number;
  easing?: EasingPreset;
  transforms?: Partial<SplitTransforms>;
  emphasisColor?: string;
  emphasisWeight?: number;
  /** 0 (present) → 1 (gone) fade-out factor from the card lifecycle. */
  exit?: number;
}

interface Token {
  text: string;
  emphasis: boolean;
}

const toWords = (segments: TextSegment[]): Token[] => {
  const tokens: Token[] = [];
  segments.forEach((seg) => {
    seg.text
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .forEach((word) => tokens.push({ text: word, emphasis: !!seg.emphasis }));
  });
  return tokens;
};

/**
 * Word/character split with a per-element staggered entrance. Replaces the
 * `.w` / `.ch` CSS keyframes; each element is driven by `useCurrentFrame()`.
 */
export const SplitText: React.FC<SplitTextProps> = ({
  segments,
  style,
  mode = "word",
  startFrame = 0,
  inFrames = 18,
  stagger = 3,
  easing = EasingPreset.Smooth,
  transforms,
  emphasisColor,
  emphasisWeight,
  exit = 0,
}) => {
  const frame = useCurrentFrame();
  const t = { ...DEFAULT_TRANSFORMS, ...transforms };
  const ease = resolveEasing(easing);
  const words = toWords(segments);

  const elementStyle = (index: number, token: Token): React.CSSProperties => {
    const delay = startFrame + index * stagger;
    const progress = interpolate(frame, [delay, delay + inFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    const ty = (1 - progress) * t.y;
    const scale = t.scale + (1 - t.scale) * progress;
    const blurPx = (1 - progress) * t.blur;
    const opacity =
      (t.opacityFrom + (1 - t.opacityFrom) * progress) * (1 - exit);
    return {
      display: "inline-block",
      opacity,
      transform: `translateY(${ty}px) scale(${scale})`,
      filter: blurPx > 0.01 ? `blur(${blurPx}px)` : undefined,
      color: token.emphasis && emphasisColor ? emphasisColor : style.color,
      fontWeight:
        token.emphasis && emphasisWeight ? emphasisWeight : style.fontWeight,
      willChange: "transform, opacity, filter",
    };
  };

  const baseStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    color: style.color,
    textTransform: style.textTransform,
  };

  if (mode === "char") {
    let charIndex = 0;
    return (
      <span style={baseStyle}>
        {words.map((token, wi) => {
          const chars = token.text.split("");
          const wordEl = (
            <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {chars.map((ch, ci) => {
                const el = (
                  <span key={ci} style={elementStyle(charIndex, token)}>
                    {ch}
                  </span>
                );
                charIndex += 1;
                return el;
              })}
            </span>
          );
          return (
            <React.Fragment key={`w-${wi}`}>
              {wordEl}
              {wi < words.length - 1 ? " " : null}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  return (
    <span style={baseStyle}>
      {words.map((token, i) => (
        <React.Fragment key={i}>
          <span style={elementStyle(i, token)}>{token.text}</span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );
};
