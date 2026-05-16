/**
 * Shared text analysis utilities for narration gates.
 */

// ── Sentence splitting ──────────────────────────────────────────────────

/**
 * Split narration into sentences. Handles prosody marks (... / — / \n\n)
 * and standard punctuation. Strips empty results.
 */
export function splitSentences(text: string): string[] {
  // Normalize prosody ellipsis variants to standard form
  const normalized = text
    .replace(/\.\.\.\s*\.\.\.\s*\.\.\./g, "⏸⏸⏸")
    .replace(/\.\.\.\s*\.\.\./g, "⏸⏸")
    .replace(/\.\.\./g, "⏸");

  // Split on sentence-ending punctuation, paragraph breaks
  const raw = normalized
    .split(/(?<=[.!?])\s+|\n\n+/)
    .map((s) => s.replace(/⏸⏸⏸/g, "... ... ...").replace(/⏸⏸/g, "... ...").replace(/⏸/g, "...").trim())
    .filter((s) => s.length > 0);

  return raw;
}

// ── Syllable counting ───────────────────────────────────────────────────

const SYLLABLE_OVERRIDES: Record<string, number> = {
  every: 3,
  the: 1,
  people: 2,
  fire: 1,
  hire: 1,
  area: 3,
  idea: 3,
  real: 1,
  being: 2,
  doing: 2,
  going: 2,
  having: 2,
  like: 1,
  time: 1,
  life: 1,
  come: 1,
  some: 1,
  were: 1,
  there: 1,
  where: 1,
  here: 1,
  give: 1,
  live: 1,
  have: 1,
  gone: 1,
  done: 1,
  none: 1,
  once: 1,
  ore: 1,
  more: 1,
  bore: 1,
  core: 1,
  sure: 1,
  pure: 1,
  whole: 1,
  quite: 1,
  while: 1,
  are: 1,
};

export function countSyllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length === 0) return 0;

  const override = SYLLABLE_OVERRIDES[lower];
  if (override !== undefined) return override;

  // Vowel-group heuristic
  const matches = lower.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;

  // Silent-e at end (but not "le" endings which add a syllable)
  if (lower.endsWith("e") && !lower.endsWith("le") && count > 1) {
    count--;
  }

  // Common suffixes that add syllables
  if (lower.endsWith("tion") || lower.endsWith("sion")) {
    // already counted by vowel groups
  }

  return Math.max(1, count);
}

// ── Word extraction ─────────────────────────────────────────────────────

/** Extract words from text, stripping prosody marks and punctuation. */
export function extractWords(text: string): string[] {
  return text
    .replace(/\.\.\./g, " ")
    .replace(/—/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
    .filter((w) => w.length > 0);
}

// ── Flesch-Kincaid grade ────────────────────────────────────────────────

export function fleschKincaidGrade(text: string): number {
  const sentences = splitSentences(text);
  const words = extractWords(text);
  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  return (
    0.39 * (words.length / sentences.length) +
    11.8 * (totalSyllables / words.length) -
    15.59
  );
}

// ── Sentence classification ─────────────────────────────────────────────

export type SentenceKind = "in-scene" | "direct-address" | "narrator-aside";

/**
 * Classify a sentence. Permissive v1:
 * - "direct-address" if it contains you/your outside quotes
 * - "narrator-aside" if 1st-person present-tense reflection
 * - "in-scene" otherwise
 */
export function classifySentence(sentence: string): SentenceKind {
  // Strip quoted speech
  const unquoted = sentence.replace(/"[^"]*"/g, "").replace(/"[^"]*"/g, "");

  // Check for direct address (you/your outside quotes)
  if (/\byou(r|rs|rself|rselves)?\b/i.test(unquoted)) {
    return "direct-address";
  }

  // Narrator-aside: 1st person present tense reflection
  if (/\bI('m| am| think| believe| wonder| know| feel| want| guess| suppose| notice)\b/i.test(unquoted)) {
    return "narrator-aside";
  }

  return "in-scene";
}

// ── Abstract-nominalization detection ───────────────────────────────────

const NOMINALIZATION_ALLOWLIST = new Set([
  "attention", "moment", "chance", "action", "position",
  "question", "mention", "section", "station", "nation",
  "condition", "situation", "information", "direction",
  "collection", "addition", "education", "generation",
  "location", "population", "tradition", "opinion",
  "movement", "moment", "statement", "management",
  "agreement", "government", "environment", "treatment",
  "apartment", "department", "entertainment", "equipment",
  "improvement", "assessment", "measurement", "achievement",
  "performance", "importance", "distance", "instance",
  "balance", "appearance", "substance", "chance",
  "community", "opportunity", "security", "activity",
  "ability", "quality", "reality", "personality",
  "university", "identity", "majority", "authority",
  "city", "party", "society",
]);

export function isAbstractNominalization(word: string): boolean {
  const lower = word.toLowerCase();
  if (NOMINALIZATION_ALLOWLIST.has(lower)) return false;
  return /(?:tion|ment|ance|ence|ity)$/i.test(lower);
}
