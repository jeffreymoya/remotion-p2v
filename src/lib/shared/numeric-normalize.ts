/**
 * Deterministic numeric-text normalization and magnitude extraction.
 *
 * Shared primitive for the docu fidelity gates (metric-extraction B1, and later
 * number-agreement B2 / anchor-strategies D1 / sentence-segmenter D2). Lives in
 * `shared/` so downstream `shared/` modules can import it without a
 * shared→docu cross-layer dependency.
 *
 * Design notes (see PLAN-brittle-algorithms-llm-delegation §2.1/§2.2):
 * - The `DataItem` value/unit contract is internally inconsistent: `$94B` is
 *   stored as `{ value: 94, unit: "B" }` (mantissa + scale word) while
 *   `250,000` is stored as `{ value: 250000, unit: "K" }` (fully expanded,
 *   scale redundant). A blind `value × scaleMultiplier(unit)` canonicalization
 *   therefore corrupts the second form. We instead compare on the **written
 *   mantissa**, and only escalate to fully-expanded comparison when BOTH the
 *   item unit AND the prose number carry a scale (which catches a "2.5 trillion"
 *   claim against a "2.5 million" anchor without breaking the `250,000` form).
 * - basis points are treated as a LITERAL number in the percent class (no ÷100):
 *   `250bps` → `{ mantissa: 250, percent }`. This matches the shipped extraction
 *   prompt (`prompts.ts`: a 25bps hike is emitted as `{ value: 25, unit: "%" }`)
 *   and the existing `number-agreement.test.ts` assertions. The "true percent"
 *   convention is a separate prompt + rendering migration, intentionally not
 *   done here.
 */

export type UnitClass = "currency" | "percent" | "multiple" | "count";
export type ScaleUnit = "T" | "B" | "M" | "K";

export interface ParsedMagnitude {
  /** The number exactly as written, before applying any scale word. e.g. 2.5 for "$2.5T". */
  mantissa: number;
  /** Scale word/suffix attached to the number, if any. */
  scale: ScaleUnit | null;
  /** mantissa × scale multiplier (mantissa when no scale). */
  expanded: number;
  /** Semantic class inferred from currency/percent/multiplier markers. */
  unitClass: UnitClass;
}

const SCALE_MULTIPLIER: Record<ScaleUnit, number> = {
  T: 1e12,
  B: 1e9,
  M: 1e6,
  K: 1e3,
};

const TOLERANCE = 0.005; // 0.5% relative

function withinTolerance(a: number, b: number): boolean {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1e-9) < TOLERANCE;
}

function isScaleUnit(unit: string): unit is ScaleUnit {
  return unit === "T" || unit === "B" || unit === "M" || unit === "K";
}

/**
 * Normalize comma usage in numeric text WITHOUT corrupting European decimals.
 *
 * - Grouping separators (`1,234,567`, `250,000`) → commas stripped.
 * - European decimal commas (`2,50`, `10,00`) → converted to a `.`.
 *
 * Heuristic: a comma followed by exactly three digits at a group boundary is a
 * grouping separator; a comma followed by one or two digits at a boundary is a
 * decimal point. (`1,250` is read as grouping → `1250`, the standard ambiguity.)
 */
export function normalizeNumericText(text: string): string {
  // Strip grouping commas first: comma preceded by a digit, followed by exactly
  // three digits at a boundary (non-digit or end-of-string).
  const grouped = text.replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1");
  // Convert remaining decimal commas: digit, comma, 1-2 digits at a boundary.
  return grouped.replace(/(\d),(\d{1,2})(?=\D|$)/g, "$1.$2");
}

// ── Word-number support (written-out numerals) ─────────────────────────

const WORD_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const WORD_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

const WORD_SCALES: Record<string, ScaleUnit> = {
  thousand: "K", million: "M", billion: "B", trillion: "T",
};

interface IntegerParse {
  value: number;
  next: number;
}

function parseIntegerWords(tokens: string[], start: number): IntegerParse | null {
  let i = start;
  let current = 0;
  let matched = false;
  while (i < tokens.length) {
    const w = tokens[i];
    if (WORD_UNITS[w] != null) {
      current += WORD_UNITS[w];
      matched = true;
      i++;
    } else if (WORD_TENS[w] != null) {
      current += WORD_TENS[w];
      matched = true;
      i++;
    } else if (w === "hundred" && matched) {
      current = (current === 0 ? 1 : current) * 100;
      i++;
    } else if (w === "and" && matched) {
      i++; // tolerate "one hundred and fifty"
    } else {
      break;
    }
  }
  return matched ? { value: current, next: i } : null;
}

/**
 * Extract magnitudes written as words ("two point five trillion", "nine point
 * one percent", "twenty five"). Conservative: only emits a magnitude when the
 * phrase carries a decimal point, a scale word, an explicit unit word, or spans
 * more than one number-word — so stray "one"/"two" in prose are not matched.
 */
function extractWrittenMagnitudes(lowerText: string): ParsedMagnitude[] {
  const tokens = lowerText.split(/[^a-z]+/).filter(Boolean);
  const out: ParsedMagnitude[] = [];

  let i = 0;
  while (i < tokens.length) {
    const intParse = parseIntegerWords(tokens, i);
    if (!intParse) {
      i++;
      continue;
    }
    let value = intParse.value;
    let j = intParse.next;
    const startTokenCount = j - i;
    let sawPoint = false;

    if (tokens[j] === "point") {
      sawPoint = true;
      j++;
      const digits: string[] = [];
      while (j < tokens.length && WORD_UNITS[tokens[j]] != null && WORD_UNITS[tokens[j]] < 10) {
        digits.push(String(WORD_UNITS[tokens[j]]));
        j++;
      }
      if (digits.length > 0) {
        value = value + Number(`0.${digits.join("")}`);
      }
    }

    let scale: ScaleUnit | null = null;
    if (tokens[j] && WORD_SCALES[tokens[j]]) {
      scale = WORD_SCALES[tokens[j]];
      j++;
    }

    let unitClass: UnitClass = "count";
    let sawUnitWord = false;
    if (tokens[j] === "percent" || (tokens[j] === "basis" && tokens[j + 1] === "points")) {
      unitClass = "percent";
      sawUnitWord = true;
    } else if (tokens[j] === "dollars" || tokens[j] === "dollar" || tokens[j] === "usd") {
      unitClass = "currency";
      sawUnitWord = true;
    } else if (tokens[j] === "times") {
      unitClass = "multiple";
      sawUnitWord = true;
    }

    const isConfident = sawPoint || scale !== null || sawUnitWord || startTokenCount > 1;
    if (isConfident) {
      out.push({
        mantissa: value,
        scale,
        expanded: scale ? value * SCALE_MULTIPLIER[scale] : value,
        unitClass,
      });
    }

    i = Math.max(j, i + 1);
  }

  return out;
}

// ── Digit-number support ───────────────────────────────────────────────

// Number, with optional `$` prefix and an optional scale/unit suffix that is
// either glued (e.g. "2.5T", "9.1%") or a spaced word (e.g. "94 billion").
// A lookbehind prevents matching digits glued to letters ("covid19") or the
// fractional part of a decimal already consumed.
const MAGNITUDE_RE =
  /(?<![\w.])(\$\s?)?(\d+(?:\.\d+)?)(?:(%|bps?|[tbmkx])|\s*(trillion|billion|million|thousand|basis\s+points?|percent|dollars?|usd|times))?/gi;

function scaleFromToken(token: string | undefined): ScaleUnit | null {
  if (!token) return null;
  switch (token.toLowerCase()) {
    case "t":
    case "trillion":
      return "T";
    case "b":
    case "billion":
      return "B";
    case "m":
    case "million":
      return "M";
    case "k":
    case "thousand":
      return "K";
    default:
      return null;
  }
}

function extractDigitMagnitudes(normalizedLower: string): ParsedMagnitude[] {
  const out: ParsedMagnitude[] = [];
  for (const m of normalizedLower.matchAll(MAGNITUDE_RE)) {
    const dollar = m[1];
    const mantissa = Number(m[2]);
    if (!Number.isFinite(mantissa)) continue;
    const glued = m[3]?.toLowerCase();
    const word = m[4]?.toLowerCase();
    const suffix = glued ?? word;

    const isPercent = suffix === "%" || suffix === "percent" || suffix === "bp" ||
      suffix === "bps" || (word ?? "").startsWith("basis point");
    const isMultiple = suffix === "x" || suffix === "times";
    const isDollarWord = suffix === "dollar" || suffix === "dollars" || suffix === "usd";

    const scale = scaleFromToken(suffix);

    let unitClass: UnitClass;
    if (dollar || isDollarWord) {
      unitClass = "currency";
    } else if (isPercent) {
      unitClass = "percent";
    } else if (isMultiple) {
      unitClass = "multiple";
    } else {
      unitClass = "count"; // bare number or magnitude word without currency marker
    }

    out.push({
      mantissa,
      scale,
      expanded: scale ? mantissa * SCALE_MULTIPLIER[scale] : mantissa,
      unitClass,
    });
  }
  return out;
}

/**
 * Extract every numeric magnitude from free text, with its semantic unit class
 * and scale. Handles `$`/percent/bps/multiplier markers, glued suffixes
 * (`$2.5T`), spaced scale words (`94 billion`), European decimal commas
 * (`2,50`), and conservatively-parsed written-out numbers.
 */
export function extractMagnitudes(text: string): ParsedMagnitude[] {
  const lower = text.toLowerCase();
  const normalized = normalizeNumericText(lower);
  return [...extractDigitMagnitudes(normalized), ...extractWrittenMagnitudes(lower)];
}

/**
 * Whether a prose magnitude's unit class is compatible with a `DataItem` unit.
 * Percent and multiplier items must match same-class prose; currency and
 * scale-word items accept currency or bare-count prose (the scale word alone
 * does not distinguish dollars from counts).
 */
export function unitClassCompatible(proseClass: UnitClass, unit: string): boolean {
  switch (unit) {
    case "%":
      return proseClass === "percent";
    case "x":
      return proseClass === "multiple";
    case "$":
      return proseClass === "currency" || proseClass === "count";
    default: // T, B, M, K
      return proseClass === "currency" || proseClass === "count";
  }
}

/**
 * Whether a parsed prose magnitude satisfies a `DataItem` (value, unit).
 *
 * Unit class must be compatible first. When both the item unit and the prose
 * number carry a scale, the fully-expanded magnitudes are compared (so a
 * "2.5 trillion" claim is rejected against a "2.5 million" anchor). Otherwise
 * the written mantissa is compared (preserving the `{250000,"K"}` ↔ "250,000"
 * form), with an expanded fallback for fully-written-out magnitudes.
 */
export function magnitudeMatchesValue(parsed: ParsedMagnitude, value: number, unit: string): boolean {
  if (!unitClassCompatible(parsed.unitClass, unit)) return false;

  const scaleUnit = isScaleUnit(unit);
  if (scaleUnit && parsed.scale) {
    return withinTolerance(parsed.expanded, value * SCALE_MULTIPLIER[unit]);
  }

  if (withinTolerance(parsed.mantissa, value)) return true;
  if (scaleUnit && withinTolerance(parsed.expanded, value * SCALE_MULTIPLIER[unit])) return true;
  return false;
}

/**
 * Whether a numeric value (with a `DataItem` unit) is attested by free text.
 * The deterministic core of the metric-fidelity gate's text-side check.
 */
export function valueMatchesText(value: number, unit: string, text: string): boolean {
  const magnitudes = extractMagnitudes(text);
  return magnitudes.some((m) => magnitudeMatchesValue(m, value, unit));
}

// ── Spoken-form rendering (digits/symbols → spoken tokens) ─────────────
//
// Used by the anchor-phrase strategy (D1) and sentence segmenter (D2) to align
// number-bearing written text against TTS word streams, which always spell
// numbers out (`"$2.5T"` is spoken `"two point five trillion dollars"`). This
// is best-effort: integer vocalization of bare years is genuinely ambiguous in
// TTS (`2013` may be "twenty thirteen" or "two thousand thirteen"); callers pair
// it with fuzzy/lookahead matching to absorb the residual.

const ONES_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const INT_SCALES: Array<{ v: number; w: string }> = [
  { v: 1e12, w: "trillion" },
  { v: 1e9, w: "billion" },
  { v: 1e6, w: "million" },
  { v: 1e3, w: "thousand" },
];

function integerToWords(n: number): string {
  if (n < 0) return `minus ${integerToWords(-n)}`;
  if (n < 20) return ONES_WORDS[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r === 0 ? TENS_WORDS[t] : `${TENS_WORDS[t]} ${ONES_WORDS[r]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return r === 0 ? `${ONES_WORDS[h]} hundred` : `${ONES_WORDS[h]} hundred ${integerToWords(r)}`;
  }
  for (const { v, w } of INT_SCALES) {
    if (n >= v) {
      const lead = Math.floor(n / v);
      const rem = n % v;
      const leadWords = `${integerToWords(lead)} ${w}`;
      return rem === 0 ? leadWords : `${leadWords} ${integerToWords(rem)}`;
    }
  }
  return String(n);
}

function numberToSpoken(numStr: string): string {
  const [intPart, fracPart] = numStr.split(".");
  const intVal = parseInt(intPart, 10);
  const intWords = Number.isFinite(intVal) ? integerToWords(intVal) : numStr;
  if (fracPart == null) return intWords;
  const fracWords = fracPart.split("").map((d) => ONES_WORDS[Number(d)] ?? d).join(" ");
  return `${intWords} point ${fracWords}`;
}

// Dedicated clone of MAGNITUDE_RE — kept separate so `.replace()` here never
// shares `lastIndex` state with `extractMagnitudes`' `matchAll`.
const MAGNITUDE_SPOKEN_RE =
  /(?<![\w.])(\$\s?)?(\d+(?:\.\d+)?)(?:(%|bps?|[tbmkx])|\s*(trillion|billion|million|thousand|basis\s+points?|percent|dollars?|usd|times))?/gi;

const SCALE_SPOKEN: Record<ScaleUnit, string> = {
  T: "trillion",
  B: "billion",
  M: "million",
  K: "thousand",
};

/**
 * Render digits and currency/percent/scale markers in `text` as the spoken
 * tokens a TTS engine emits, leaving non-numeric text untouched. e.g.
 * `"$2.5T deal"` → `"two point five trillion dollars deal"`.
 */
export function toSpokenForm(text: string): string {
  const normalized = normalizeNumericText(text);
  return normalized.replace(
    MAGNITUDE_SPOKEN_RE,
    (_full, dollar: string | undefined, num: string, glued: string | undefined, word: string | undefined) => {
      const suffix = (glued ?? word ?? "").toLowerCase();
      const scale = scaleFromToken(suffix);
      const isPercent = suffix === "%" || suffix === "percent" || suffix === "bp" ||
        suffix === "bps" || suffix.startsWith("basis");
      const isMultiple = suffix === "x" || suffix === "times";
      const isDollarWord = suffix === "dollar" || suffix === "dollars" || suffix === "usd";

      const parts = [numberToSpoken(num)];
      if (scale) parts.push(SCALE_SPOKEN[scale]);
      if (isPercent) {
        parts.push(suffix.startsWith("b") || suffix.startsWith("basis") ? "basis points" : "percent");
      } else if (isMultiple) {
        parts.push("times");
      }
      if (dollar || isDollarWord) parts.push("dollars");

      return parts.join(" ");
    },
  );
}
