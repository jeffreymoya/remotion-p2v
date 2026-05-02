import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { appendRuntimeNote, writeVariationArtifacts } from "@/src/lib/prompt-optimizer/logger";
import type { VariationResult } from "@/src/lib/prompt-optimizer/types";

describe("logger artifacts", () => {
  it("writes prompt, script, judge errors, and runtime notes", async () => {
    const runDir = await mkdtemp(path.join(os.tmpdir(), "prompt-optimizer-test-"));
    await seedRunFiles(runDir);

    const variation: VariationResult = {
      loop: 1,
      variation: 2,
      prompt: "Prompt text",
      script: null,
      scriptError: "Gemini failed",
      judgeResults: [
        {
          judge: "codex",
          failed: true,
          error: "Codex failed",
          rawResponse: "bad json",
          attempts: 2,
        },
      ],
      validJudgeCount: 0,
      skipped: true,
      skipReason: "Gemini failed",
    };

    await writeVariationArtifacts(runDir, variation);
    await appendRuntimeNote(runDir, "codexReasoningDowngrade: test note");

    await expect(readFile(path.join(runDir, "prompts", "L1-V2.txt"), "utf-8")).resolves.toBe("Prompt text");
    await expect(readFile(path.join(runDir, "scripts", "L1-V2.error.txt"), "utf-8")).resolves.toBe(
      "Gemini failed"
    );
    await expect(readFile(path.join(runDir, "judgements", "L1-V2-codex.error.txt"), "utf-8")).resolves.toContain(
      "bad json"
    );
    await expect(readFile(path.join(runDir, "run.json"), "utf-8")).resolves.toContain(
      "codexReasoningDowngrade: test note"
    );
  });
});

async function seedRunFiles(runDir: string): Promise<void> {
  await Promise.all([
    mkdir(path.join(runDir, "prompts"), { recursive: true }),
    mkdir(path.join(runDir, "scripts"), { recursive: true }),
    mkdir(path.join(runDir, "judgements"), { recursive: true }),
  ]);
  await writeFile(
    path.join(runDir, "run.json"),
    JSON.stringify({
      runId: "test",
      topic: "topic",
      topicContext: "context",
      geo: "US",
      config: {
        variationCount: 1,
        loopCount: 1,
        dimensionWeights: {},
        modelConfig: {},
        synthesize: false,
        empirical: false,
        maxContextHeadlines: 5,
      },
      cliVersions: { claude: "c", codex: "x", gemini: "g" },
      runtimeNotes: [],
      loopSummary: [],
      shortlist: [],
      humanSelection: null,
      startedAt: "2026-04-21T00:00:00.000Z",
      completedAt: null,
    }),
    "utf-8"
  );
  await writeFile(path.join(runDir, "log.md"), "", "utf-8");
}
