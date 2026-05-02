import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";

import type { CliVersions } from "./types";

const execFileAsync = promisify(execFile);

export async function runPreflight(config: { synthesize: boolean; topic?: number }): Promise<CliVersions> {
  const versions: CliVersions = {
    claude: await readVersion("claude"),
    codex: await readVersion("codex"),
    gemini: await readVersion("gemini"),
  };

  if (config.synthesize && !process.env.GOOGLE_TTS_API_KEY?.trim()) {
    throw new Error("GOOGLE_TTS_API_KEY is not set. Run with --no-synthesize to skip TTS, or set the key.");
  }

  if (config.topic === undefined && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new Error(
      "Prompt optimizer v1 requires an interactive TTY for topic selection. Use --topic <n> to pre-select."
    );
  }

  await mkdir("logs/prompt-optimizer", { recursive: true });

  return versions;
}

async function readVersion(command: keyof CliVersions): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(command, ["--version"], {
      encoding: "utf-8",
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    return (stdout || stderr).trim().split(/\r?\n/)[0] || "unknown";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Required CLI "${command}" is unavailable or failed --version: ${message}`);
  }
}
