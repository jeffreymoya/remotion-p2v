import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import {
  SPECIFICITY_MIN_NAMED_ENTITIES,
  SPECIFICITY_MIN_DATED_MOMENTS,
} from "../../../config";

// Common sentence-initial words that aren't named entities
const COMMON_INITIAL = new Set([
  "i", "we", "you", "he", "she", "it", "they", "the", "a", "an", "this",
  "that", "these", "those", "my", "your", "his", "her", "its", "our", "their",
  "some", "any", "every", "each", "all", "both", "few", "many", "much", "more",
  "most", "other", "another", "such", "what", "which", "who", "whom", "whose",
  "when", "where", "why", "how", "if", "then", "than", "but", "and", "or",
  "nor", "not", "no", "so", "yet", "still", "also", "too", "just", "only",
  "even", "now", "here", "there", "up", "out", "on", "off", "in", "at", "to",
  "for", "of", "by", "with", "from", "about", "into", "through", "during",
  "before", "after", "above", "below", "between", "under", "over", "again",
  "further", "once", "see", "right", "well", "one", "two", "three", "four",
  "five", "six", "seven", "eight", "nine", "ten", "let", "don't", "didn't",
  "can't", "won't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't",
  "hadn't", "doesn't", "wouldn't", "shouldn't", "couldn't", "might", "must",
  "shall", "should", "would", "could", "may", "do", "does", "did", "will",
  "had", "has", "have", "am", "is", "are", "was", "were", "be", "been",
  "being", "get", "got", "getting", "go", "going", "went", "come", "came",
  "take", "took", "make", "made", "say", "said", "tell", "told", "ask",
  "asked", "think", "thought", "know", "knew", "look", "looked", "want",
  "wanted", "give", "gave", "use", "used", "find", "found", "put", "keep",
  "kept", "set", "seem", "need", "try", "leave", "left", "call", "called",
  "turn", "start", "show", "hear", "play", "run", "move", "like", "live",
  "believe", "hold", "bring", "happen", "write", "sit", "stand", "lose",
  "pay", "meet", "include", "continue", "learn", "change", "lead", "understand",
  "watch", "follow", "stop", "create", "speak", "read", "allow", "add",
  "spend", "grow", "open", "walk", "win", "offer", "remember", "love",
  "consider", "appear", "buy", "wait", "serve", "die", "send", "expect",
  "build", "stay", "fall", "cut", "reach", "kill", "remain", "suggest",
  "raise", "pass", "sell", "require", "report", "decide", "pull",
  "meanwhile", "because", "although", "however", "therefore", "otherwise",
  "instead", "perhaps", "maybe", "actually", "really", "certainly",
  "probably", "sometimes", "never", "always", "often", "usually", "still",
  "already", "suddenly", "slowly", "quickly", "first", "second", "third",
  "last", "next", "finally", "anyway", "besides", "imagine", "picture",
]);

const DATED_MOMENT_PATTERN = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|\d{4}|\d{1,2}:\d{2}|that year|last year|last week|last month|years? ago|months? ago|weeks? ago|days? ago|that morning|that evening|that night|that afternoon|one Tuesday|one Monday|one Friday)\b/gi;

const MEASURED_QUANTITY_PATTERN = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s+(years?|months?|weeks?|days?|hours?|minutes?|seconds?|percent|dollars?|pounds?|miles?|feet|inches?|meters?|people|times?|things?)\b/gi;

export const specificityGate: Gate = {
  name: "specificity",
  kind: "deterministic",
  async run(narration: string, _ctx: GateContext): Promise<GateResult> {
    const notes: GateNote[] = [];

    // Count named entities: capitalized words not at sentence start and not in common list
    const namedEntities = new Set<string>();
    const personEntities = new Set<string>();
    const sentences = narration.split(/(?<=[.!?])\s+|\n\n+/).filter(Boolean);
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const cleaned = words[i].replace(/[^a-zA-Z'-]/g, "");
        if (
          cleaned.length > 1 &&
          /^[A-Z]/.test(cleaned) &&
          !COMMON_INITIAL.has(cleaned.toLowerCase()) &&
          // Filter out contractions (I'm, It's, He's, etc.)
          !/'/.test(cleaned)
        ) {
          namedEntities.add(cleaned);

          // Person heuristic A: two consecutive capitalized words (first+last name)
          if (i + 1 < words.length) {
            const next = words[i + 1].replace(/[^a-zA-Z'-]/g, "");
            if (
              next.length > 1 &&
              /^[A-Z]/.test(next) &&
              !COMMON_INITIAL.has(next.toLowerCase()) &&
              !/'/.test(next)
            ) {
              personEntities.add(`${cleaned} ${next}`);
            }
          }

          // Person heuristic B: single name preceded by attribution pattern
          // e.g. "call her Maria", "named Maria", "known as Maria"
          if (i >= 2) {
            const twoBack = words.slice(Math.max(0, i - 3), i).join(" ").toLowerCase();
            if (/\b(call(?:ed)?\s+(?:her|him)|named|known as|let's call)\b/.test(twoBack)) {
              personEntities.add(cleaned);
            }
          }

          // Person heuristic C: name followed by a possessive or verb indicating personhood
          if (i + 1 < words.length) {
            const nextRaw = words[i + 1];
            if (/^(said|wrote|told|asked|explained|argued|noted|claimed|suggested|showed|found|spent|discovered|published)\b/i.test(nextRaw)) {
              personEntities.add(cleaned);
            }
          }
        }
      }
    }

    // Count dated moments
    const datedMoments = new Set<string>();
    let match: RegExpExecArray | null;
    DATED_MOMENT_PATTERN.lastIndex = 0;
    while ((match = DATED_MOMENT_PATTERN.exec(narration)) !== null) {
      datedMoments.add(match[0].toLowerCase());
    }

    // Count measured quantities
    const measuredQuantities = new Set<string>();
    MEASURED_QUANTITY_PATTERN.lastIndex = 0;
    while ((match = MEASURED_QUANTITY_PATTERN.exec(narration)) !== null) {
      measuredQuantities.add(match[0].toLowerCase());
    }

    const entityCount = namedEntities.size;
    const datedCount = datedMoments.size;

    if (entityCount < SPECIFICITY_MIN_NAMED_ENTITIES) {
      notes.push({
        gate: "specificity",
        severity: "block",
        evidence: `Found ${entityCount} named entities: [${[...namedEntities].join(", ")}]`,
        message: `Only ${entityCount} named entities found (need ≥${SPECIFICITY_MIN_NAMED_ENTITIES}). Chapter lacks concrete specificity.`,
        suggestion: `Add named people, places, or specific objects. E.g. "Maria", "the pothos on her desk", "a café on Elm Street".`,
      });
    }

    if (personEntities.size < 1) {
      notes.push({
        gate: "specificity",
        severity: "block",
        evidence: `Found ${personEntities.size} person names (need ≥1). Named entities: [${[...namedEntities].join(", ")}]`,
        message: `No person name found — at least one named person (first + last name) required per chapter.`,
        suggestion: `Add at least one named person with first and last name. E.g. "Angela Duckworth", "Viktor Frankl", "Hannah Reyes".`,
      });
    }

    if (datedCount < SPECIFICITY_MIN_DATED_MOMENTS) {
      notes.push({
        gate: "specificity",
        severity: "block",
        evidence: `Found ${datedCount} dated moments: [${[...datedMoments].join(", ")}]`,
        message: `Only ${datedCount} dated moments found (need ≥${SPECIFICITY_MIN_DATED_MOMENTS}). Chapter lacks temporal grounding.`,
        suggestion: `Add at least one specific time reference: "one Tuesday in March", "eight years later", "that winter".`,
      });
    }

    return {
      gate: "specificity",
      pass: notes.filter((n) => n.severity === "block").length === 0,
      notes,
      metrics: {
        namedEntities: entityCount,
        personEntities: personEntities.size,
        datedMoments: datedCount,
        measuredQuantities: measuredQuantities.size,
        entityNames: [...namedEntities].join(", "),
        personNames: [...personEntities].join(", "),
      },
    };
  },
};
