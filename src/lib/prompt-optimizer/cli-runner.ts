import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { z } from "zod";

import { withTimeoutAndRetry } from "@/src/lib/utils/retry";
import type { CliJsonResult, CliRuntimeContext, CliTextResult } from "./types";

const execFileAsync = promisify(execFile);
const RETRY = { maxRetries: 1, retryDelayMs: 1000, exponentialBackoff: false };
const NO_RETRY = { maxRetries: 0, retryDelayMs: 0, exponentialBackoff: false };
const MAX_BUFFER = 10 * 1024 * 1024;
const TIMEOUT = 300_000;
const CODEX_TIMEOUT = 60_000;

class CliRunnerError extends Error {
  rawResponse?: string;
  stderr?: string;
  attempts?: number;

  constructor(message: string, details: { rawResponse?: string; stderr?: string; attempts?: number } = {}) {
    super(message);
    this.name = "CliRunnerError";
    this.rawResponse = details.rawResponse;
    this.stderr = details.stderr;
    this.attempts = details.attempts;
  }
}

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) {
    throw new CliRunnerError("Response did not contain a JSON object", { rawResponse: raw });
  }

  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace < firstBrace) {
    throw new CliRunnerError("Response did not contain a complete JSON object", { rawResponse: raw });
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

export async function runClaudeJson<T>(
  userPrompt: string,
  systemPrompt: string,
  schema: z.ZodSchema<T>,
  model: string
): Promise<CliJsonResult<T>> {
  let attempts = 0;
  let lastRaw = "";
  let lastStderr = "";

  try {
    const result = await withTimeoutAndRetry(
      async () => {
        attempts++;
        console.log(`  [claude] ${model} effort=high (attempt ${attempts}, timeout 300s)...`);
        const t0 = Date.now();
        const { stdout, stderr } = await execFileAsync(
          "claude",
          [
            "-p",
            userPrompt,
            "--model",
            model,
            "--effort",
            "high",
            "--output-format",
            "json",
            "--append-system-prompt",
            systemPrompt,
            "--tools",
            "",
            "--bare",
          ],
          { encoding: "utf-8", timeout: TIMEOUT, maxBuffer: MAX_BUFFER }
        );
        console.log(`  [claude] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        lastRaw = stdout;
        lastStderr = stderr;
        const envelope = extractResultEvent(parseJson(stdout, stdout, stderr), stdout, stderr);
        const rawResult = envelope.result;
        if (rawResult === undefined) {
          throw new CliRunnerError("Claude response envelope missing 'result' field", { rawResponse: stdout, stderr });
        }
        const resultText = typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult);
        const data = parseAndValidate(resultText, schema, stderr);
        return { data, rawResponse: resultText, stderr, attempts };
      },
      TIMEOUT,
      RETRY,
      "Claude meta-prompter"
    );
    return result;
  } catch (error) {
    throw attachDetails(error, lastRaw, lastStderr, attempts);
  }
}

export async function runCodexJson<T>(
  userPrompt: string,
  schema: z.ZodSchema<T>,
  model: string,
  runtime?: CliRuntimeContext
): Promise<CliJsonResult<T>> {
  let attempts = 0;
  let lastRaw = "";
  let lastStderr = "";

  try {
    return await withTimeoutAndRetry(
      async () => {
        attempts++;
        console.log(`  [codex] ${model} reasoning=medium (attempt ${attempts}, timeout 60s)...`);
        const t0 = Date.now();
        const outputPath = path.join(os.tmpdir(), `codex-judge-${randomUUID()}.txt`);
        await mkdir(path.dirname(outputPath), { recursive: true });
        try {
          let commandResult: { stdout: string; stderr: string };
          try {
            commandResult = await execFileAsync(
              "codex",
              [
                "exec",
                userPrompt,
                "-m",
                model,
                "-c",
                'model_reasoning_effort="medium"',
                "-s",
                "read-only",
                "--json",
                "--output-last-message",
                outputPath,
              ],
              { encoding: "utf-8", timeout: CODEX_TIMEOUT, maxBuffer: MAX_BUFFER }
            );
          } catch (error) {
            if (!isRejectedReasoningFlag(error)) {
              throw error;
            }
            await runtime?.addRuntimeNote(
              "codexReasoningDowngrade: model_reasoning_effort flag rejected, proceeding without it"
            );
            commandResult = await execFileAsync(
              "codex",
              ["exec", userPrompt, "-m", model, "-s", "read-only", "--json", "--output-last-message", outputPath],
              { encoding: "utf-8", timeout: CODEX_TIMEOUT, maxBuffer: MAX_BUFFER }
            );
          }

          console.log(`  [codex] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
          lastStderr = commandResult.stderr;
          lastRaw = await readFile(outputPath, "utf-8");
          const data = parseAndValidate(lastRaw, schema, lastStderr);
          return { data, rawResponse: lastRaw, stderr: lastStderr, attempts };
        } finally {
          await rm(outputPath, { force: true });
        }
      },
      CODEX_TIMEOUT,
      NO_RETRY,
      "Codex judge"
    );
  } catch (error) {
    throw attachDetails(error, lastRaw, lastStderr, attempts);
  }
}

export async function runGeminiText(prompt: string, model: string): Promise<CliTextResult> {
  let attempts = 0;
  let lastRaw = "";
  let lastStderr = "";

  try {
    return await withTimeoutAndRetry(
      async () => {
        attempts++;
        console.log(`  [gemini] ${model} text (attempt ${attempts}, timeout 300s)...`);
        const t0 = Date.now();
        const { stdout, stderr } = await execFileAsync(
          "gemini",
          ["-p", prompt, "--model", model, "--output-format", "text", "--yolo"],
          { encoding: "utf-8", timeout: TIMEOUT, maxBuffer: MAX_BUFFER }
        );
        console.log(`  [gemini] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        lastRaw = stdout;
        lastStderr = stderr;
        return { text: stdout.trim(), stderr, attempts };
      },
      TIMEOUT,
      RETRY,
      "Gemini script generation"
    );
  } catch (error) {
    throw attachDetails(error, lastRaw, lastStderr, attempts);
  }
}

export async function runGeminiJson<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string
): Promise<CliJsonResult<T>> {
  let attempts = 0;
  let lastRaw = "";
  let lastStderr = "";

  try {
    return await withTimeoutAndRetry(
      async () => {
        attempts++;
        console.log(`  [gemini] ${model} json (attempt ${attempts}, timeout 300s)...`);
        const t0 = Date.now();
        const { stdout, stderr } = await execFileAsync(
          "gemini",
          ["-p", prompt, "--model", model, "--output-format", "json", "--yolo"],
          { encoding: "utf-8", timeout: TIMEOUT, maxBuffer: MAX_BUFFER }
        );
        console.log(`  [gemini] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        lastRaw = stdout;
        lastStderr = stderr;
        const envelope = parseJson(stdout, stdout, stderr) as { response?: unknown };
        const responseText =
          typeof envelope.response === "string"
            ? envelope.response
            : envelope.response !== undefined
              ? JSON.stringify(envelope.response)
              : stdout;
        const data = parseAndValidate(responseText, schema, stderr);
        return { data, rawResponse: responseText, stderr, attempts };
      },
      TIMEOUT,
      RETRY,
      "Gemini judge"
    );
  } catch (error) {
    throw attachDetails(error, lastRaw, lastStderr, attempts);
  }
}

function extractResultEvent(
  parsed: unknown,
  rawResponse: string,
  stderr?: string
): { result?: unknown } {
  if (!Array.isArray(parsed)) {
    return parsed as { result?: unknown };
  }
  type Event = { type?: string; result?: unknown };
  const events = parsed as Event[];
  let resultEvent: Event | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.type === "result") {
      resultEvent = events[i];
      break;
    }
  }
  if (!resultEvent) {
    throw new CliRunnerError("No result event found in Claude JSON output", { rawResponse, stderr });
  }
  return resultEvent;
}

function parseAndValidate<T>(raw: string, schema: z.ZodSchema<T>, stderr?: string): T {
  const parsed = parseJson(cleanJsonResponse(raw), raw, stderr);
  return schema.parse(parsed);
}

function parseJson(rawJson: string, rawResponse: string, stderr?: string): unknown {
  try {
    return JSON.parse(rawJson);
  } catch (error) {
    throw new CliRunnerError(error instanceof Error ? error.message : String(error), {
      rawResponse,
      stderr,
    });
  }
}

function attachDetails(error: unknown, rawResponse: string, stderr: string, attempts: number): Error {
  const base = error instanceof Error ? error : new Error(String(error));
  (base as CliRunnerError).rawResponse = (base as CliRunnerError).rawResponse ?? rawResponse;
  (base as CliRunnerError).stderr = (base as CliRunnerError).stderr ?? stderr;
  (base as CliRunnerError).attempts = attempts;
  return base;
}

function isRejectedReasoningFlag(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const stderr =
    typeof error === "object" && error !== null && "stderr" in error
      ? String((error as { stderr?: unknown }).stderr ?? "")
      : "";
  const combined = `${message}\n${stderr}`.toLowerCase();
  return combined.includes("unknown config") || combined.includes("unknown key") || combined.includes("invalid config");
}
