import { describe, expect, it } from "vitest";

import { cleanJsonResponse } from "@/src/lib/prompt-optimizer/cli-runner";
import { JudgeResponseSchema } from "@/src/lib/prompt-optimizer/rubric";

const validJudgePayload = {
  dimensions: {
    speakability: { score: 8, rationale: "Natural aloud." },
    rhythm_variation: { score: 7, rationale: "Good pacing." },
    conversational_authenticity: { score: 8, rationale: "Feels conversational." },
    hook_strength: { score: 7, rationale: "Solid opening." },
    emotional_arc: { score: 6, rationale: "Some movement." },
    audience_retention: { score: 7, rationale: "Keeps curiosity." },
    coherence_flow: { score: 8, rationale: "Smooth sequence." },
    memorability: { score: 6, rationale: "Decent close." },
  },
};

describe("cleanJsonResponse", () => {
  it("extracts fenced JSON", () => {
    const raw = `\`\`\`json
${JSON.stringify(validJudgePayload)}
\`\`\``;

    expect(JSON.parse(cleanJsonResponse(raw))).toEqual(validJudgePayload);
  });

  it("extracts prefixed JSON", () => {
    const raw = `Here is the score:\n${JSON.stringify(validJudgePayload)}\nThanks.`;

    expect(JSON.parse(cleanJsonResponse(raw))).toEqual(validJudgePayload);
  });

  it("rejects output without a JSON object", () => {
    expect(() => cleanJsonResponse("not json")).toThrow(/JSON object/);
  });
});

describe("JudgeResponseSchema", () => {
  it("accepts the strict complete judge response", () => {
    expect(JudgeResponseSchema.parse(validJudgePayload)).toEqual(validJudgePayload);
  });

  it("rejects missing dimensions", () => {
    const incomplete = {
      dimensions: {
        ...validJudgePayload.dimensions,
        memorability: undefined,
      },
    };

    expect(() => JudgeResponseSchema.parse(incomplete)).toThrow();
  });
});
