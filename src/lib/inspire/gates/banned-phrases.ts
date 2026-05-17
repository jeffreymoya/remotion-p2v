/**
 * Banned vocabulary, phrases, openers, and closing patterns.
 * Seeded from the resilience-run failures.
 */

export const BANNED_LEXICON: readonly string[] = [
  "agency",
  "becoming",
  "forge",
  "forged",
  "forging",
  "drift",
  "paralysis",
  "rebirth",
  "awakening",
  "true self",
  "authentic self",
] as const;

export const BANNED_PHRASES: readonly string[] = [
  "comfort zone",
  "the wall you keep hitting",
  "the weight you've been carrying",
  "the voice that whispers",
  "the fog that won't lift",
  "a thought cut through",
  "a thought surfaced",
  "hands went cold",
  "the silence got loud",
  "sharp as glass",
  "raw material",
  "your own becoming",
  "the only path back",
  "you're being forged",
  "the part where I'm supposed to break",
  "then one morning",
  "then one day",
  "then it hit me",
] as const;

export const BANNED_OPENERS: readonly RegExp[] = [
  /^We('ve| have) all\b/i,
  /^Here's what nobody tells you\b/i,
  /^Let me take you back\b/i,
  /^What if I told you\b/i,
  /^You know that feeling\b/i,
  /^Picture this\b/i,
  /^Imagine\b/i,
] as const;

export const BANNED_CLOSING_PATTERNS = {
  /** Three or more consecutive imperative-mood sentences at chapter end. */
  imperativeStack: /^(You will not|You must|Don't look away)\b/i,
  /** Sentences starting with these at chapter close are always banned. */
  closingStarters: [
    /^You will not\b/i,
    /^You must\b/i,
    /^Don't look away\b/i,
  ] as readonly RegExp[],
} as const;

/**
 * Build word-boundary regex patterns for banned lexicon.
 * Supports multi-word entries.
 */
export function buildBannedLexiconPatterns(
  allowWords?: string[],
): RegExp[] {
  const allowed = new Set((allowWords ?? []).map((w) => w.toLowerCase()));
  return BANNED_LEXICON
    .filter((word) => !allowed.has(word.toLowerCase()))
    .map((word) => new RegExp(`\\b${escapeRegex(word)}\\b`, "gi"));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
