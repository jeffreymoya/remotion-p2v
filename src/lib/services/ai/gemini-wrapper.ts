import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { aiLogger as dbAILogger, AiCallContext } from "./ai-logger";
import { aiLogger } from "@/src/lib/logger";
import { getSettings } from "@/src/lib/storyflow/settings";

const execFileAsync = promisify(execFile);

// Default models (can be overridden via settings)
export const GEMINI_MODELS = {
  PRO: "gemini-3-pro",
  FLASH: "gemini-3-flash",
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
  durationMs: number;
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

export async function geminiCall<T>(
  context: Omit<AiCallContext, "provider">,
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResult<T>> {
  const settings = await getSettings();

  // Use options > settings > defaults
  const primaryModel = options.model ?? settings.ai.model;

  // Select fallback based on tier: if using proModel, use proFallbackModel
  const isProTier = primaryModel === settings.ai.proModel || primaryModel.includes("-pro");
  const fallbackModel = options.fallbackModel ??
    (isProTier ? settings.ai.proFallbackModel : settings.ai.fallbackModel);

  const format = options.outputFormat ?? "json";

  return dbAILogger.wrap<T>(
    { ...context, provider: "gemini-cli", model: primaryModel },
    prompt,
    async () => {
      let rawResponse: string;
      let tokens: { prompt: number; response: number } | undefined;
      let usedModel = primaryModel;

      try {
        const result = await executeGeminiCall(primaryModel, format, prompt);
        rawResponse = result.rawResponse;
        tokens = result.tokens;
      } catch (primaryError) {
        // If primary model fails and we have a fallback, try it
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
            // Both failed, throw the original error
            throw primaryError;
          }
        } else {
          throw primaryError;
        }
      }

      if (usedModel !== primaryModel) {
        aiLogger.info({ fallbackModel: usedModel }, "Used fallback model successfully");
      }

      const result = format === "json" ? JSON.parse(rawResponse) : ((rawResponse as unknown) as T);
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
