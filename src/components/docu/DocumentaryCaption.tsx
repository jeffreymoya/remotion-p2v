import React from "react";
import { AbsoluteFill } from "remotion";
import type { DocuPalette } from "./docu-tokens";
import { PALETTE_MAP } from "./docu-tokens";
import type { DocuSentence } from "./DocumentaryComposition";
import { DocumentaryCaption as S2vDocumentaryCaption } from "./captions/DocumentaryCaption";

interface DocumentaryCaptionProps {
  frame: number;
  fps: number;
  wordTimings: Array<{
    word: string;
    startSeconds: number;
    endSeconds: number;
  }>;
  sentences: DocuSentence[];
  palette: DocuPalette;
}

export const DocumentaryCaption: React.FC<DocumentaryCaptionProps> = ({
  frame: _frame,
  fps: _fps,
  wordTimings,
  sentences,
  palette,
}) => {
  return (
    <AbsoluteFill>
      <S2vDocumentaryCaption
        wordTimings={wordTimings}
        sentences={sentences}
        accent={PALETTE_MAP[palette].captionAccent}
        textColor="#e2e8f0"
      />
    </AbsoluteFill>
  );
};
