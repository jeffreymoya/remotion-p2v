import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { aiLogger as dbAILogger, AiCallContext } from "./ai-logger";
import { aiLogger } from "@/src/lib/logger";
import { getSettings } from "@/src/lib/storyflow/settings";
import { parseGeminiOutput } from "@/src/lib/storyflow/gemini-parser";
import type { Milliseconds } from "@/src/lib/types/units";

const execFileAsync = promisify(execFile);

// Default models (can be overridden via settings)
export const GEMINI_MODELS = {
  PRO: "gemini-2.5-pro",
  FLASH: "gemini-2.5-flash",
} as const;

type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS] | string;

interface GeminiOptions {
  model?: GeminiModel;
  fallbackModel?: string;
  outputFormat?: "json" | "text" | "stream-json";
}

interface GeminiResult<T> {
  data: T;
  logId: string;
  durationMs: Milliseconds;
  tokens?: { prompt: number; response: number };
  rawResponse?: string;
}

async function executeGeminiCall(
  model: string,
  format: string,
  prompt: string
): Promise<{ rawResponse: string; tokens?: { prompt: number; response: number } }> {
  const args = ["--yolo", "--model", model, "--output-format", format, prompt];

  const { stdout: rawResponse } = await execFileAsync("gemini", args, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: 300000,
  });

  const tokens = parseGeminiTokenUsage(rawResponse);
  return { rawResponse, tokens };
}

export async function runGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<{ rawResponse: string; tokens?: { prompt: number; response: number }; usedModel: string }> {
  const settings = await getSettings();

  const primaryModel = options.model ?? settings.ai.model;
  const isProTier = primaryModel === settings.ai.proModel || primaryModel.includes("-pro");
  const fallbackModel =
    options.fallbackModel ?? (isProTier ? settings.ai.proFallbackModel : settings.ai.fallbackModel);

  const format = options.outputFormat ?? "json";

  let rawResponse: string;
  let tokens: { prompt: number; response: number } | undefined;
  let usedModel = primaryModel;

  try {
    const result = await executeGeminiCall(primaryModel, format, prompt);
    rawResponse = result.rawResponse;
    tokens = result.tokens;
  } catch (primaryError) {
    if (fallbackModel) {
      aiLogger.warn(
        {
          primaryModel,
          fallbackModel,
          error: primaryError instanceof Error ? primaryError.message : String(primaryError),
        },
        "Primary model failed, trying fallback"
      );
      try {
        const result = await executeGeminiCall(fallbackModel, format, prompt);
        rawResponse = result.rawResponse;
        tokens = result.tokens;
        usedModel = fallbackModel;
      } catch {
        throw primaryError;
      }
    } else {
      throw primaryError;
    }
  }

  if (usedModel !== primaryModel) {
    aiLogger.info({ fallbackModel: usedModel }, "Used fallback model successfully");
  }

  return { rawResponse, tokens, usedModel };
}

export async function geminiCall<T>(
  context: Omit<AiCallContext, "provider">,
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResult<T>> {
  return dbAILogger.wrap<T>(
    { ...context, provider: "gemini-cli", model: options.model },
    prompt,
    async () => {
      const { rawResponse, tokens } = await runGemini(prompt, options);
      const format = options.outputFormat ?? "json";
      const result =
        format === "json"
          ? parseGeminiOutput<T>(rawResponse)
          : ((rawResponse as unknown) as T);
      return { result, rawResponse, tokens };
    }
  );
}

export function parseGeminiTokenUsage(
  output: string
): { prompt: number; response: number } | undefined {
  const usageMatch = output.match(/usage[:\s]+(\d+)\s*prompt[,\s]+(\d+)\s*response/i);
  if (usageMatch) {
    return { prompt: Number.parseInt(usageMatch[1], 10), response: Number.parseInt(usageMatch[2], 10) };
  }
  return undefined;
}
