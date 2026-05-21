// Topic-adaptive archetype registry.
//
// Each archetype overlays role-specific opener/development guidance on top of
// the same chapter-role vocabulary ("open" | "build" | "complicate" | "turn"
// | "land") used by the rest of the pipeline. The planner picks one archetype
// per topic and stores it on the LongformPlan; chapter draft prompts read it
// to choose the opener pattern that best fits the topic family.

type ChapterRole = "open" | "build" | "complicate" | "turn" | "land";

export interface NarrationArchetypeDefinition {
  description: string;
  topicSignals: readonly string[];
  narrativeArc: string;
  chapterRoleGuidance: Record<ChapterRole, string>;
  hookPreference: string;
  closePreference: string;
}

export const ARCHETYPES = {
  "essayist-with-sources": {
    description:
      "Warm but argumentative essayist building a case from canonical sources. Best when the topic invites overturning a common misconception with research-backed reframes.",
    topicSignals: [
      "psychology",
      "mindset",
      "habits",
      "identity",
      "resilience",
      "self-perception",
      "behavior change",
    ],
    narrativeArc:
      "misconception → proof from canonical source → new lens handed to the reader",
    chapterRoleGuidance: {
      open: "Open with the central misconception or paradigm claim the chapter will overturn — placed inside a protagonist scene, not as a collective-address generalization.",
      build:
        "Do NOT open with a misconception frame. Extend a thread from the prior chapter with a new citation or concrete example that deepens the argument.",
      complicate:
        "Introduce the tension or counter-evidence that complicates the thesis — keep it concrete to the protagonist, not abstract.",
      turn: "Open with the tension earned through prior chapters, not a new misconception. The reframe lands here.",
      land: "Open with a callback to the image or question from chapter 1; close by handing the reader the new lens.",
    },
    hookPreference:
      "embedded-citation opener or scene-then-claim — never a collective-address paradigm challenge",
    closePreference:
      "concrete image or dateable action by the protagonist that embodies the new lens",
  },
  "storytelling-arc": {
    description:
      "Character-driven narrative that follows a single protagonist's transformation through a discrete sequence of events. Best when the topic is biographical or rests on a journey.",
    topicSignals: [
      "biography",
      "transformation",
      "journey",
      "discovery",
      "redemption",
      "coming-of-age",
      "career pivot",
    ],
    narrativeArc:
      "situation → complication → crisis → resolution",
    chapterRoleGuidance: {
      open: "Open in scene with the protagonist's ordinary world — establish situation and stakes before any argument.",
      build:
        "Introduce the first complication — an obstacle, a discovery, a choice — that pushes the protagonist off their baseline.",
      complicate:
        "Deepen the complication; let the protagonist try and fail an obvious path before the deeper crisis lands.",
      turn: "Stage the crisis — the moment the protagonist must change, not merely act. Tension is highest here.",
      land: "Show the resolution as a changed protagonist in a concrete new scene — what they do differently now, not what they say.",
    },
    hookPreference:
      "scene-first opener with a specific time, place, and small physical detail",
    closePreference:
      "a final scene that mirrors the opening but with the protagonist changed",
  },
  "analytical-argument": {
    description:
      "Diagnostic essay that moves from a visible problem to its underlying mechanism and a proposed solution. Best when the topic is a system, strategy, or decision pattern.",
    topicSignals: [
      "systems",
      "productivity",
      "strategy",
      "decision-making",
      "incentives",
      "process",
      "organizational dynamics",
    ],
    narrativeArc:
      "problem → cause → mechanism → solution",
    chapterRoleGuidance: {
      open: "Open with the problem as the protagonist actually experiences it — concrete and specific, not abstract framing.",
      build:
        "Name the cause: surface the hidden driver behind the visible problem with at least one verified anchor.",
      complicate:
        "Show why the obvious fix fails — the second-order effect or feedback loop that traps the protagonist.",
      turn: "Reveal the underlying mechanism — the structural insight that reframes the problem. Use a load-bearing analogy if the mechanism is complex.",
      land: "Hand over a concrete operating principle the protagonist (and reader) can apply tomorrow — not a slogan.",
    },
    hookPreference:
      "concrete-symptom opener that names the problem in the protagonist's life",
    closePreference:
      "a single principle or rule of thumb embodied in a protagonist action",
  },
  "personal-meditation": {
    description:
      "Quiet, reflective register that sits with an experience rather than arguing it. Best when the topic is grief, mortality, belonging, or meaning — where the listener needs space, not assertion.",
    topicSignals: [
      "grief",
      "loneliness",
      "belonging",
      "mortality",
      "meaning",
      "love",
      "loss",
      "the sacred ordinary",
    ],
    narrativeArc:
      "observation → deepening → recognition → integration",
    chapterRoleGuidance: {
      open: "Open with a small, specific observation about the protagonist — domestic, sensory, unhurried. No thesis, no argument.",
      build:
        "Deepen the observation. Stay close to one image or recurring object; let the meaning accumulate through attention, not argument.",
      complicate:
        "Let the harder feeling underneath the observation surface — the loss, fear, or longing that the surface scene was holding.",
      turn: "Move to the moment of recognition — when the protagonist sees what the experience has been teaching them. Quiet, not climactic.",
      land: "Integration — show the protagonist back in the ordinary, changed inwardly. Close on an image, not a statement.",
    },
    hookPreference:
      "sensory-domestic opener — a small physical detail in the protagonist's day",
    closePreference:
      "a quiet image that lingers; never an imperative or affirmation stack",
  },
} as const satisfies Record<string, NarrationArchetypeDefinition>;

export type NarrationArchetype = keyof typeof ARCHETYPES;

export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES) as NarrationArchetype[];

export const DEFAULT_ARCHETYPE: NarrationArchetype = "essayist-with-sources";

// Compact subset surfaced to the planner LLM — excludes per-role guidance to
// keep the prompt small. Per-role guidance is injected at chapter-draft time.
type ArchetypeSummary = Pick<
  NarrationArchetypeDefinition,
  "description" | "topicSignals" | "narrativeArc"
>;

export const ARCHETYPES_FOR_PROMPT: Record<NarrationArchetype, ArchetypeSummary> =
  ARCHETYPE_KEYS.reduce(
    (acc, k) => {
      acc[k] = {
        description: ARCHETYPES[k].description,
        topicSignals: ARCHETYPES[k].topicSignals,
        narrativeArc: ARCHETYPES[k].narrativeArc,
      };
      return acc;
    },
    {} as Record<NarrationArchetype, ArchetypeSummary>,
  );

export function getRoleGuidance(
  archetype: NarrationArchetype,
  role: string,
): string | null {
  const guidance = ARCHETYPES[archetype].chapterRoleGuidance as Record<string, string>;
  return guidance[role] ?? null;
}
