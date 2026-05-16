import type { Gate, GateContext, GateResult, GateNote } from "../gate-types";
import { splitSentences, classifySentence } from "../../refine/text-metrics";
import { SERMON_RATIO_DIRECT_ADDRESS_MAX } from "../../../config";

export const sermonRatioGate: Gate = {
  name: "sermon_ratio",
  kind: "deterministic",
  async run(narration: string, _ctx: GateContext): Promise<GateResult> {
    const notes: GateNote[] = [];
    const sentences = splitSentences(narration);
    if (sentences.length === 0) {
      return { gate: "sermon_ratio", pass: true, notes, metrics: { ratio: 0, total: 0, directAddress: 0 } };
    }

    let directAddressCount = 0;
    const directAddressSentences: string[] = [];

    for (const sentence of sentences) {
      const kind = classifySentence(sentence);
      if (kind === "direct-address") {
        directAddressCount++;
        directAddressSentences.push(sentence);
      }
    }

    const ratio = directAddressCount / sentences.length;
    const pass = ratio <= SERMON_RATIO_DIRECT_ADDRESS_MAX;

    if (!pass) {
      // Show up to 3 example direct-address sentences
      const examples = directAddressSentences.slice(0, 3);
      notes.push({
        gate: "sermon_ratio",
        severity: "block",
        evidence: examples.map((s) => s.slice(0, 60)).join(" | "),
        message: `Direct-address ratio ${(ratio * 100).toFixed(0)}% exceeds ${(SERMON_RATIO_DIRECT_ADDRESS_MAX * 100).toFixed(0)}% max. ${directAddressCount}/${sentences.length} sentences address the listener.`,
        suggestion: `Convert most "you/your" sentences to in-scene narration (named entities, past-tense observation) or narrator-aside ("I think...", "I noticed...").`,
      });
    }

    return {
      gate: "sermon_ratio",
      pass,
      notes,
      metrics: {
        ratio: Math.round(ratio * 100),
        total: sentences.length,
        directAddress: directAddressCount,
      },
    };
  },
};
