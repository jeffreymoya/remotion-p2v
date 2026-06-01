// AI-disclosure decision helper (Step 3 / YPP Backlog 5).
//
// YouTube requires creators to disclose *realistic altered or synthetic content*
// — making a real person appear to say or do something they did not, altering
// footage of a real event or place, or generating a realistic scene that did not
// occur. (YouTube Help: "Disclosing use of GenAI content".) A synthetic
// narration voiceover, hand-coded charts, licensed stock B-roll, and attributed
// real third-party clips do *not* meet that threshold on their own, so the
// current docu pipeline's default answer is "No".
//
// This module is the *decision* layer: pure, no IO. Given a set of yes/no
// signals about what the video actually contains, it returns the recommended
// YouTube Studio answer plus a rationale that is persisted into the publish
// manifest's `aiDisclosure` field (Backlog 1 criterion). The CLI wrapper
// (`scripts/docu-ai-disclosure.ts`) collects the signals (flags + manifest
// context) and writes the result back into the manifest.
//
// This is a workflow aid, not legal advice — YouTube's policy is the authority
// and changes over time. That caveat is carried into every rationale so it
// survives in the manifest.

import type { AiDisclosure } from "./publish-manifest";

// ── Signals ─────────────────────────────────────────────────────────────────

/**
 * What the video contains, expressed as the disclosure-relevant questions from
 * YouTube's policy. Every signal defaults to `false` — that default reflects the
 * current pipeline (animated compositions + generic TTS + stock + attributed
 * real clips), which requires no disclosure. Only an affirmative signal flips
 * the recommendation.
 */
export interface DisclosureSignals {
  /** AI-generated realistic people, faces, or avatars that look real. */
  syntheticRealisticPeople?: boolean;
  /** Altered footage of a real event or place presented as real. */
  alteredRealEventFootage?: boolean;
  /** A generated realistic scene that did not actually occur ("fake footage"). */
  syntheticRealisticScenes?: boolean;
  /** A real person made to appear to say or do something they did not. */
  fabricatedRealPersonSpeech?: boolean;
  /** A cloned voice of an identifiable real person (not generic TTS). */
  clonedVoiceOfRealPerson?: boolean;
  /**
   * Contextual only: the narration uses a synthetic TTS voice. This never
   * triggers disclosure on its own — it is recorded so the rationale can state
   * explicitly that generic narration TTS was considered and excluded.
   */
  syntheticNarrationVoice?: boolean;
}

export interface DisclosureDecision {
  /** Persisted into the publish manifest. */
  disclosure: AiDisclosure;
  /** Human-readable list of the signals that required disclosure (empty ⇒ none). */
  triggers: string[];
}

// ── Trigger catalogue ─────────────────────────────────────────────────────────

/** One entry per disclosure-triggering signal, in policy-statement form. */
const TRIGGERS: ReadonlyArray<{
  key: keyof DisclosureSignals;
  reason: string;
}> = [
  { key: "syntheticRealisticPeople", reason: "AI-generated realistic people, faces, or avatars" },
  { key: "alteredRealEventFootage", reason: "altered footage of a real event or place" },
  { key: "syntheticRealisticScenes", reason: "a generated realistic scene that did not occur" },
  { key: "fabricatedRealPersonSpeech", reason: "a real person made to appear to say or do something they did not" },
  { key: "clonedVoiceOfRealPerson", reason: "a cloned voice of an identifiable real person" },
];

export const NOT_LEGAL_ADVICE =
  "This is a workflow aid, not legal advice; confirm against YouTube's current GenAI disclosure policy before publishing.";

const STUDIO_ANSWER_YES =
  'Yes — answer "Yes" to YouTube Studio\'s "altered or synthetic content" question and apply the AI-content label.';
const STUDIO_ANSWER_NO =
  'No — the "altered or synthetic content" disclosure does not apply to this video.';

// ── Decision ──────────────────────────────────────────────────────────────────

/**
 * Decide the recommended AI-disclosure answer from the supplied signals. Pure:
 * no IO, no clock. Disclosure is required when *any* triggering signal is true;
 * generic narration TTS is contextual and never flips the result.
 */
export function decideAiDisclosure(signals: DisclosureSignals): DisclosureDecision {
  const triggers = TRIGGERS.filter((t) => signals[t.key] === true).map((t) => t.reason);
  const required = triggers.length > 0;

  const rationale = required
    ? `Disclosure required: the video contains ${joinList(triggers)}, which YouTube treats as ` +
      `realistic altered or synthetic content. ${NOT_LEGAL_ADVICE}`
    : `Disclosure not required: this video is an animated documentary composition built from ` +
      `licensed stock imagery, hand-coded charts/overlays, and${
        signals.syntheticNarrationVoice ? " a synthetic narration voiceover and" : ""
      } any third-party footage carrying on-screen attribution. ` +
      `A narration voiceover is not a realistic synthetic depiction of a real person, event, or place, ` +
      `so YouTube's altered/synthetic-content disclosure does not apply. ${NOT_LEGAL_ADVICE}`;

  return {
    disclosure: {
      containsSyntheticPeopleVoicesOrEvents: required,
      recommendedStudioAnswer: required ? STUDIO_ANSWER_YES : STUDIO_ANSWER_NO,
      rationale,
    },
    triggers,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "a", "a and b", or "a, b, and c" — Oxford comma. */
function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
