// Metadata review gate (Step 3 / report P1 §8, §10 "Title/thumbnail fields pass
// metadata lint").
//
// The fake-trailer terminations (Screen Culture, KH Studio) show that misleading
// *metadata* — not just misleading content — is a serious escalation path under
// YouTube's spam/misleading policy. This module lints the human-authored YouTube
// metadata (title, description, tags, and any claim baked into the thumbnail)
// against the video's own narration and provenance before publish.
//
// It is pure (no IO, no clock): given the proposed metadata plus context derived
// from artifacts (narration sentences, whether the video carries research
// sources), it returns findings with severity. The CLI wrapper
// (`scripts/docu-metadata-gate.ts`) supplies that context from
// `prompts/docu/<slug>-*.json` and decides the exit code.
//
// The gate is an automated lint, not editorial sign-off: it catches mechanical
// red flags (fabricated figures, fake-footage thumbnail language, certainty
// overstatement, keyword stuffing) but a human reviewer still confirms that any
// strong claim is "literally true and sourced" (report §8). That caveat is
// carried into the relevant finding messages.

// ── Types ─────────────────────────────────────────────────────────────────

export interface VideoMetadata {
  title: string;
  description?: string;
  tags?: string[];
  /**
   * Human-supplied text of any claim baked into the thumbnail. The pipeline has
   * no thumbnail generator and the gate does no vision, so thumbnail claims are
   * linted only when their text is provided here.
   */
  thumbnailText?: string;
}

export interface MetadataGateContext {
  /** Narration sentence texts — the ground truth a title claim must be supported by. */
  narration: string[];
  /**
   * Whether the video carries research source URLs (manifest `sources`). A
   * sensational claim with sources is downgraded to a warning the human must
   * confirm; without sources it blocks.
   */
  hasSources: boolean;
  /**
   * Terms that define the video's subject for tag-relevance checks. Defaults to
   * the content tokens of the title + narration when omitted.
   */
  topicTerms?: string[];
}

export type Severity = "block" | "warn";

export interface MetadataFinding {
  severity: Severity;
  /** Stable rule identifier (e.g. "title-number-unsupported"). */
  check: string;
  message: string;
}

export interface MetadataGateResult {
  findings: MetadataFinding[];
  /** True when any finding is a block. */
  blocked: boolean;
  /** True when there are no findings at all. */
  clean: boolean;
}

// ── Rule catalogues ───────────────────────────────────────────────────────────

/**
 * Loud claim language that implies provenance ("leaked", "official"),
 * confirmation ("confirmed", "proof"), or pure hype ("shocking", "you won't
 * believe"). Per report §8 these are admissible only when "literally true and
 * sourced", so they warn when the video has sources and block when it does not.
 */
export const SENSATIONAL_TERMS: readonly string[] = [
  "leaked",
  "official",
  "confirmed",
  "shocking proof",
  "shocking",
  "exposed",
  "bombshell",
  "you won't believe",
  "you wont believe",
  "secret revealed",
  "the truth they",
  "they don't want you",
  "they dont want you",
  "must see",
  "gone wrong",
];

/**
 * Thumbnail language that implies fake footage, fake quotes, or false events.
 * These block regardless of sources — a thumbnail asserting captured footage of
 * an event we never filmed is the exact fake-trailer pattern YouTube terminated.
 */
export const FAKE_FOOTAGE_TERMS: readonly string[] = [
  "exclusive footage",
  "caught on camera",
  "caught on tape",
  "leaked footage",
  "real footage",
  "actual footage",
  "secret recording",
  "hidden camera",
];

/**
 * Absolute-certainty / guarantee language. In finance, legal, and the other
 * high-RPM niches this is both a credibility risk and a misleading-claims risk,
 * so the description must hedge. Always a warning (style + compliance, not a
 * hard fabrication).
 */
export const CERTAINTY_TERMS: readonly string[] = [
  "guaranteed",
  "guarantee",
  "risk-free",
  "risk free",
  "no risk",
  "will definitely",
  "definitely will",
  "always profit",
  "never lose",
  "can't lose",
  "cant lose",
  "sure thing",
  "100% safe",
  "proven to",
  "certain to",
];

/** YouTube's tag count is generous; well past this reads as keyword stuffing. */
export const MAX_TAGS = 30;

/** Minimum share of a title's content words that must appear in the narration. */
export const MIN_TITLE_SUPPORT_RATIO = 0.34;

export const NOT_EDITORIAL_SIGNOFF =
  "Automated metadata lint, not editorial sign-off — a human reviewer must confirm any strong claim is literally true and sourced.";

const STOPWORDS = new Set<string>([
  "the", "and", "for", "your", "you", "are", "with", "that", "this", "from", "how",
  "why", "what", "when", "who", "into", "out", "off", "all", "can", "will", "just",
  "not", "but", "has", "have", "had", "was", "were", "his", "her", "its", "their",
  "they", "them", "our", "about", "over", "than", "then", "now", "new", "get", "got",
  "a", "an", "of", "to", "in", "on", "is", "it", "as", "at", "by", "or", "be", "do",
]);

// ── Text helpers ──────────────────────────────────────────────────────────────

function hasText(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Lowercased content tokens (alphanumeric, ≥3 chars, non-stopword). */
function contentTokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t),
  );
}

/** Digit-run figures (commas stripped) e.g. "$9 trillion" → ["9"], "5.5%" → ["5.5"]. */
function numberTokens(text: string): string[] {
  return (text.match(/\d[\d,]*\.?\d*/g) ?? []).map((n) => n.replace(/,/g, ""));
}

function includesAny(haystack: string, needles: readonly string[]): string[] {
  const lower = haystack.toLowerCase();
  return needles.filter((n) => lower.includes(n));
}

function isYearLike(n: string): boolean {
  if (!/^\d{4}$/.test(n)) return false;
  const y = Number(n);
  return y >= 1900 && y <= 2099;
}

// ── Individual checks ─────────────────────────────────────────────────────────

function checkTitleMissing(meta: VideoMetadata): MetadataFinding[] {
  if (hasText(meta.title)) return [];
  return [{ severity: "block", check: "title-missing", message: "Title is empty — nothing to publish or lint." }];
}

function checkSensationalClaims(meta: VideoMetadata, ctx: MetadataGateContext): MetadataFinding[] {
  const surface = [meta.title, meta.thumbnailText].filter(hasText).join("  ");
  const hits = includesAny(surface, SENSATIONAL_TERMS);
  if (hits.length === 0) return [];
  const severity: Severity = ctx.hasSources ? "warn" : "block";
  const tail = ctx.hasSources
    ? "Confirm each is literally true and backed by a cited source, or remove it."
    : "This video carries no research sources, so the claim cannot be substantiated — remove it.";
  return [
    {
      severity,
      check: "sensational-claim",
      message: `Title/thumbnail uses claim language (${hits.join(", ")}). ${tail}`,
    },
  ];
}

function checkThumbnailFake(meta: VideoMetadata): MetadataFinding[] {
  if (!hasText(meta.thumbnailText)) return [];
  const hits = includesAny(meta.thumbnailText, FAKE_FOOTAGE_TERMS);
  if (hits.length === 0) return [];
  return [
    {
      severity: "block",
      check: "thumbnail-fake",
      message:
        `Thumbnail text implies fake or captured footage (${hits.join(", ")}). ` +
        "An animated documentary has no such footage; this is the fake-trailer pattern YouTube terminates.",
    },
  ];
}

function checkTitleNumbers(meta: VideoMetadata, ctx: MetadataGateContext): MetadataFinding[] {
  if (!hasText(meta.title)) return [];
  const narrationNums = new Set(ctx.narration.flatMap(numberTokens));
  const findings: MetadataFinding[] = [];
  for (const n of numberTokens(meta.title)) {
    if (narrationNums.has(n)) continue;
    const yearLike = isYearLike(n);
    findings.push({
      severity: yearLike ? "warn" : "block",
      check: "title-number-unsupported",
      message:
        `Title states the figure "${n}" which does not appear in the narration. ` +
        (yearLike
          ? "Confirm the year is mentioned in the video, or remove it from the title."
          : "A headline number must be spoken and sourced in the video — fix the title or the narration."),
    });
  }
  return findings;
}

function checkTitleSupport(meta: VideoMetadata, ctx: MetadataGateContext): MetadataFinding[] {
  if (!hasText(meta.title)) return [];
  const titleTokens = contentTokens(meta.title);
  if (titleTokens.length === 0) return [];
  const narrationTokens = new Set(ctx.narration.flatMap(contentTokens));
  const supported = titleTokens.filter((t) => narrationTokens.has(t));
  const ratio = supported.length / titleTokens.length;
  if (ratio >= MIN_TITLE_SUPPORT_RATIO) return [];
  return [
    {
      severity: "warn",
      check: "title-weak-support",
      message:
        `Only ${supported.length}/${titleTokens.length} of the title's key words appear in the narration ` +
        `(${Math.round(ratio * 100)}%). The title may promise something the video does not cover.`,
    },
  ];
}

function checkDescriptionCertainty(meta: VideoMetadata): MetadataFinding[] {
  if (!hasText(meta.description)) return [];
  const hits = includesAny(meta.description, CERTAINTY_TERMS);
  if (hits.length === 0) return [];
  return [
    {
      severity: "warn",
      check: "description-overstates-certainty",
      message:
        `Description overstates certainty (${hits.join(", ")}). ` +
        "High-RPM finance/legal content must hedge — qualify or remove these claims.",
    },
  ];
}

function checkTags(meta: VideoMetadata, ctx: MetadataGateContext): MetadataFinding[] {
  const tags = (meta.tags ?? []).filter(hasText);
  if (tags.length === 0) return [];
  const findings: MetadataFinding[] = [];

  if (tags.length > MAX_TAGS) {
    findings.push({
      severity: "warn",
      check: "tag-stuffing",
      message: `${tags.length} tags exceeds the ${MAX_TAGS}-tag lint threshold — this reads as keyword stuffing.`,
    });
  }

  const topic = new Set<string>([
    ...(ctx.topicTerms ?? []).flatMap(contentTokens),
    ...contentTokens(meta.title ?? ""),
    ...ctx.narration.flatMap(contentTokens),
  ]);
  if (topic.size > 0) {
    const offTopic = tags.filter((tag) => {
      const toks = contentTokens(tag);
      return toks.length > 0 && !toks.some((t) => topic.has(t));
    });
    if (offTopic.length > 0) {
      findings.push({
        severity: "warn",
        check: "tag-off-topic",
        message:
          `Tags unrelated to the video's content: ${offTopic.join(", ")}. ` +
          "Drop off-topic high-RPM bait tags — they are a misleading-metadata signal.",
      });
    }
  }

  return findings;
}

// ── Entry point ────────────────────────────────────────────────────────────────

/**
 * Lint the proposed YouTube metadata against the video's narration and
 * provenance. Pure: no IO. Findings carry severity — `block` for fabrication /
 * fake-footage red flags, `warn` for claims a human must confirm or soften.
 */
export function runMetadataGate(meta: VideoMetadata, ctx: MetadataGateContext): MetadataGateResult {
  const findings: MetadataFinding[] = [
    ...checkTitleMissing(meta),
    ...checkSensationalClaims(meta, ctx),
    ...checkThumbnailFake(meta),
    ...checkTitleNumbers(meta, ctx),
    ...checkTitleSupport(meta, ctx),
    ...checkDescriptionCertainty(meta),
    ...checkTags(meta, ctx),
  ];

  return {
    findings,
    blocked: findings.some((f) => f.severity === "block"),
    clean: findings.length === 0,
  };
}
