// Shared source of truth for narration writer prompt + reviewer prompt.
// Every NARRATION_GUIDELINES rule has a matching NARRATION_RUBRICS entry and a
// matching RUBRIC_CATEGORIES key. Keep them in lockstep.

export const RUBRIC_CATEGORIES = [
  "hook",
  "aristotelian_balance",
  "emotional_contrast",
  "god_devil_terms",
  "rhetorical_devices",
  "pronoun_strategy",
  "metaphorical_imagery",
  "quoted_anchor",
  "prosody_marks",
  "landing_line",
  "role_fit",
] as const;

export type RubricCategory = (typeof RUBRIC_CATEGORIES)[number];

export const NARRATION_GUIDELINES = `## Engagement & Emotion Guidelines

These are prescriptive, TTS-actionable rules. Apply every rule to every chapter
unless a rule is explicitly scoped to a specific role (e.g. hook → Chapter 1).

- **Hook (Chapter 1 only).** First 3–5 sentences must use one of: Provocative
  Statement, In Media Res, Shared Problem, Rhetorical Mystery, Confession.
  No greetings, no "today I want to talk about", no preamble. Establish a
  stake — what the listener loses by not paying attention.
- **Aristotelian balance.** Every chapter must carry: (a) confident
  declaratives (ethos), (b) concrete vivid imagery for any feeling (pathos),
  (c) at least one data point, causal claim, or named mechanism (logos),
  (d) at least one urgency marker — "right now", "this year", "before this
  ends" (kairos).
- **Emotional contrast (Seesaw).** Every chapter must contain at least one
  polarity flip: low→high or high→low. Flat trajectories — even continuous
  joy — rate as longwinded. The flip is usually one to two sentences at the
  turn.
- **God-terms vs. Devil-terms.** Each chapter must anchor to at least one
  god-term cluster (freedom, mastery, agency, dignity, clarity, courage,
  honesty, purpose) opposed to at least one named devil-term (comfort-zone,
  distraction, conformity, fear, shame, noise, paralysis, drift). The tension
  between the clusters drives the chapter.
- **Rhetorical devices.** At least one of the following per chapter:
  anaphora (repeat at clause starts), antitheton (opposing pairs), asyndeton
  (no-conjunction lists), climax (ascending power), anadiplosis (end-word →
  start-word chain), germination (single-word repetition for emphasis). Drop
  epiphora and symploke. Two devices is good; more than three feels mannered.
- **Pronoun strategy.** Pivot deliberately at least once per chapter between
  "I / me" (vulnerable anchor) and "we / us / you" (universalizing direct
  address). Lower status with "I", bridge with "we", land on "you".
- **Metaphorical imagery.** Externalize feelings as physical or non-human
  entities — "the weight you've been carrying", "the voice that whispers",
  "the wall you keep hitting", "the fog that won't lift". The listener can
  battle a thing; they cannot battle abstract psychological resistance.
- **Colloquialisms over jargon.** Use everyday phrasing. Strip academic,
  corporate, and clinical vocabulary unless quoting evidence. "You know that
  feeling" beats "this experiential phenomenon".
- **Prosody marks.** Use graduated pauses for dramatic pacing:
  \`...\` (short pause — brief beat, mid-sentence hesitation),
  \`... ...\` (medium pause — pre-reveal suspense, letting a point land),
  \`... ... ...\` (long pause — major emotional beat, scene transition, or
  after a climactic line that needs silence to breathe).
  Also use \`—\` (abrupt shift / urgency), \`( )\` (aside, voice naturally
  lowers), \`\\n\\n\` (section reset). Requirements: at least THREE pause marks
  per chapter, using at least two different pause lengths. Place medium/long
  pauses before reveals, after quoted anchors, and at emotional peaks.
- **Quoted anchor.** Exactly ONE standalone double-quoted sentence per
  chapter, 5–12 words, at the emotional peak. Internal voice, belief, or
  aphorism — never dialogue between characters.
- **Landing line.** End the chapter on a short 3–8 word line that gives the
  TTS a beat of silence and the listener a moment to absorb. The landing line
  is its own sentence on its own line.
- **Role fit.** The chapter must do the work its role assigns it (Hook /
  Setup / Development / Turning Point / Payoff). A "Hook" chapter that
  meanders is broken, even if every other rule is satisfied.

## One-Story Model (Cross-Chapter)

When the script has 3+ chapters:

- Plant **information seeds** — minor details in early chapters that pay off
  later (a phrase, an image, a named figure).
- Use **setups and callbacks** — repeat a key phrase across chapters so its
  return in the Payoff lands.
- Maintain **character continuity** — if an example person appears, keep them
  across chapters rather than introducing new faces per chapter.
`;

export const NARRATION_RUBRICS = `## Scoring Rubric (per category, 0–3)

Score each category for the chapter under review. Use this scale for every
category:

- **0 — absent.** The chapter does not attempt this technique.
- **1 — weak.** Attempted but executed poorly, vague, or barely present.
- **2 — adequate.** Clearly present and functional but not memorable.
- **3 — strong.** Executed with craft; the technique is doing real work in the
  chapter.

### Categories

- **hook** — Chapter 1 only: does the opening (first 3–5 sentences) use one of
  Provocative Statement, In Media Res, Shared Problem, Rhetorical Mystery,
  Confession, AND skip all formalities, AND establish a stake? For chapters
  other than Chapter 1, score this category 3 by default unless the chapter
  *should* have opened with a hook but didn't.
- **aristotelian_balance** — Are all four appeals present? (Ethos via
  confident declaratives, pathos via concrete imagery, logos via a data
  point or causal claim, kairos via an urgency marker.) Missing one = 1–2;
  missing two or more = 0.
- **emotional_contrast** — Does the chapter contain at least one clear
  polarity flip (low→high or high→low)? Score 0 if flat throughout.
- **god_devil_terms** — Is the chapter anchored to a god-term cluster opposed
  to a named devil-term? Score 0 if the chapter has no values-laden anchor or
  no adversary.
- **rhetorical_devices** — Does the chapter use at least one of: anaphora,
  antitheton, asyndeton, climax, anadiplosis, germination? Score 3 if two or
  more are deployed with craft.
- **pronoun_strategy** — Is there a deliberate pivot between "I / me" and
  "we / us / you" at least once? Score 0 if the chapter stays in a single
  pronoun register throughout.
- **metaphorical_imagery** — Are abstract feelings externalized as physical
  or non-human entities? Score 0 if struggles are labeled abstractly only.
  Penalize jargon and clinical vocabulary heavily here.
- **quoted_anchor** — Exactly ONE standalone double-quoted sentence, 5–12
  words, at the emotional peak. Two or more quoted sentences, zero quoted
  sentences, or a quote that is dialogue between characters = 0–1.
- **prosody_marks** — Are at least two distinct prosody marks used
  (\`...\`, \`—\`, \`( )\`, \`\\n\\n\`)? Score 0 if none are present.
- **landing_line** — Does the chapter end on a short 3–8 word line on its
  own that gives the TTS a beat? Score 0 if the chapter ends mid-paragraph
  or on a long sentence.
- **role_fit** — Does the chapter do the work its role assigns it (Hook /
  Setup / Development / Turning Point / Payoff)? Score 0 if the chapter is
  clearly mis-assigned (e.g. a "Payoff" chapter that opens a new problem
  without resolving anything).

## Verdict

- Compute total score across all 11 categories (max 33).
- Verdict is \`revise\` if (a) any category score is ≤ 1, OR (b) total < 22.
- Otherwise verdict is \`pass\`.

For each category scored ≤ 2, return a note with: the criterion name, what is
wrong, and a concrete suggestion for the rewrite (not a generic restatement of
the rule).
`;
