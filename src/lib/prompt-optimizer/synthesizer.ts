import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { GoogleTTSProvider } from "@/src/lib/services/tts/google-tts";
import { withTimeoutAndRetry } from "@/src/lib/utils/retry";
import { updateRunJson, writeShortlistSummary } from "./logger";
import type { ShortlistEntry, SynthesisResult } from "./types";

const RETRY = { maxRetries: 1, retryDelayMs: 1000, exponentialBackoff: false };

export function escapeSsmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function synthesizeScript(inputPath: string, outputPath: string): Promise<SynthesisResult> {
  try {
    const rawScript = await readFile(inputPath, "utf-8");
    const provider = new GoogleTTSProvider(process.env.GOOGLE_TTS_API_KEY);
    const result = await withTimeoutAndRetry(
      () => provider.generateAudio(escapeSsmlText(rawScript)),
      30_000,
      RETRY,
      "Google TTS synthesis"
    );
    await writeFile(outputPath, result.audioBuffer);
    return { inputPath, outputPath, success: true };
  } catch (error) {
    return {
      inputPath,
      outputPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function synthesizeShortlist(
  runDir: string,
  shortlist: ShortlistEntry[],
  includeLoop1Pool: boolean
): Promise<void> {
  for (const entry of shortlist) {
    const inputPath = path.join(runDir, entry.scriptPath);
    const relativeOutput = path.join("shortlist", `candidate-${entry.rank}.mp3`);
    const outputPath = path.join(runDir, relativeOutput);
    const result = await synthesizeScript(inputPath, outputPath);

    if (result.success) {
      entry.audioPath = relativeOutput;
      entry.audioError = undefined;
    } else {
      entry.audioError = result.error ?? "unknown synthesis error";
      await writeFile(
        path.join(runDir, "shortlist", `candidate-${entry.rank}.error.txt`),
        entry.audioError,
        "utf-8"
      );
    }

    await writeShortlistSummary(runDir, shortlist);
  }

  if (includeLoop1Pool) {
    await synthesizeLoop1Pool(runDir);
  }

  await updateRunJson(runDir, (runJson) => {
    runJson.shortlist = shortlist.map(({ rank, loop, variation, overall, audioPath, audioError }) => ({
      rank,
      loop,
      variation,
      overall,
      audioPath,
      audioError,
    }));
    return runJson;
  });
}

async function synthesizeLoop1Pool(runDir: string): Promise<void> {
  const poolDir = path.join(runDir, "loop1-pool");
  const files = (await readdir(poolDir)).filter((file) => file.endsWith(".txt"));

  for (const file of files) {
    const inputPath = path.join(poolDir, file);
    const outputPath = path.join(poolDir, file.replace(/\.txt$/, ".mp3"));
    const result = await synthesizeScript(inputPath, outputPath);
    if (!result.success) {
      await writeFile(outputPath.replace(/\.mp3$/, ".error.txt"), result.error ?? "unknown synthesis error", "utf-8");
    }
  }
}
