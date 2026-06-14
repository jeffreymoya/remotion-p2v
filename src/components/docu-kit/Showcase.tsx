import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { COLORS } from "./utils/tokens";
import { TitleCard, titleCardSchema, titleCardDefaults } from "./cards/TitleCard";
import { LowerThirdChyron, lowerThirdSchema, lowerThirdDefaults } from "./cards/LowerThirdChyron";
import { KineticNumber, kineticNumberSchema, kineticNumberDefaults } from "./cards/KineticNumber";
import { RedactedReveal, redactedRevealSchema, redactedRevealDefaults } from "./cards/RedactedReveal";
import { MarkerHighlight, markerHighlightSchema, markerHighlightDefaults } from "./cards/MarkerHighlight";
import { TypewriterMemo, typewriterMemoSchema, typewriterMemoDefaults } from "./cards/TypewriterMemo";
import { PullQuote, pullQuoteSchema, pullQuoteDefaults } from "./cards/PullQuote";
import { BreakingNews, breakingNewsSchema, breakingNewsDefaults } from "./cards/BreakingNews";
import { SourceAttribution, sourceAttributionSchema, sourceAttributionDefaults } from "./cards/SourceAttribution";
import { EvidenceStamp, evidenceStampSchema, evidenceStampDefaults } from "./cards/EvidenceStamp";

export const SHOWCASE_FPS = 30;

/** Per-card placement on the showcase timeline (frames at 30fps). */
export const SHOWCASE_TIMELINE = {
  title: { from: 0, duration: 120 },
  chyron: { from: 120, duration: 120 },
  number: { from: 240, duration: 150 },
  redacted: { from: 390, duration: 150 },
  highlight: { from: 540, duration: 165 },
  memo: { from: 705, duration: 270 },
  quote: { from: 975, duration: 150 },
  breaking: { from: 1125, duration: 150 },
  source: { from: 1275, duration: 120 },
  evidence: { from: 1395, duration: 150 },
} as const;

export const SHOWCASE_DURATION =
  SHOWCASE_TIMELINE.evidence.from + SHOWCASE_TIMELINE.evidence.duration;

export const showcaseSchema = z.object({
  backdrop: z.string(),
  title: titleCardSchema,
  chyron: lowerThirdSchema,
  number: kineticNumberSchema,
  redacted: redactedRevealSchema,
  highlight: markerHighlightSchema,
  memo: typewriterMemoSchema,
  quote: pullQuoteSchema,
  breaking: breakingNewsSchema,
  source: sourceAttributionSchema,
  evidence: evidenceStampSchema,
});

export type ShowcaseProps = z.infer<typeof showcaseSchema>;

export const showcaseDefaults: ShowcaseProps = {
  backdrop: COLORS.bg,
  title: titleCardDefaults,
  chyron: lowerThirdDefaults,
  number: kineticNumberDefaults,
  redacted: redactedRevealDefaults,
  highlight: {
    ...markerHighlightDefaults,
    textColor: COLORS.fg,
    secondaryColor: "rgba(239,233,220,0.72)",
    mutedColor: COLORS.muted,
  },
  memo: {
    ...typewriterMemoDefaults,
    textColor: COLORS.fg,
  },
  quote: pullQuoteDefaults,
  breaking: breakingNewsDefaults,
  source: sourceAttributionDefaults,
  evidence: {
    ...evidenceStampDefaults,
    textColor: COLORS.fg,
    secondaryColor: "rgba(239,233,220,0.78)",
    mutedColor: COLORS.muted,
  },
};

/**
 * Showcase cycling all 10 overlay cards. The cards themselves are transparent;
 * `backdrop` is a preview-only fill so each card is legible when scrubbing in
 * Studio. Set `backdrop` to `transparent` to see true overlay output.
 */
export const Showcase: React.FC<ShowcaseProps> = (props) => {
  const p = { ...showcaseDefaults, ...props };
  return (
    <AbsoluteFill style={{ background: p.backdrop }}>
      <Sequence from={SHOWCASE_TIMELINE.title.from} durationInFrames={SHOWCASE_TIMELINE.title.duration}>
        <TitleCard {...p.title} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.chyron.from} durationInFrames={SHOWCASE_TIMELINE.chyron.duration}>
        <LowerThirdChyron {...p.chyron} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.number.from} durationInFrames={SHOWCASE_TIMELINE.number.duration}>
        <KineticNumber {...p.number} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.redacted.from} durationInFrames={SHOWCASE_TIMELINE.redacted.duration}>
        <RedactedReveal {...p.redacted} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.highlight.from} durationInFrames={SHOWCASE_TIMELINE.highlight.duration}>
        <MarkerHighlight {...p.highlight} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.memo.from} durationInFrames={SHOWCASE_TIMELINE.memo.duration}>
        <TypewriterMemo {...p.memo} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.quote.from} durationInFrames={SHOWCASE_TIMELINE.quote.duration}>
        <PullQuote {...p.quote} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.breaking.from} durationInFrames={SHOWCASE_TIMELINE.breaking.duration}>
        <BreakingNews {...p.breaking} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.source.from} durationInFrames={SHOWCASE_TIMELINE.source.duration}>
        <SourceAttribution {...p.source} />
      </Sequence>
      <Sequence from={SHOWCASE_TIMELINE.evidence.from} durationInFrames={SHOWCASE_TIMELINE.evidence.duration}>
        <EvidenceStamp {...p.evidence} />
      </Sequence>
    </AbsoluteFill>
  );
};
