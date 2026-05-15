import React from "react";
import { AccumulateCaption } from "./AccumulateCaption";
import { FadeCaption } from "./FadeCaption";
import type { WordCaptionProps } from "./types";

export type { WordCaptionProps };

export const WORD_VARIANTS = {
  accumulate: AccumulateCaption,
  fade: FadeCaption,
} satisfies Record<string, React.FC<WordCaptionProps>>;

export type WordVariant = keyof typeof WORD_VARIANTS;
