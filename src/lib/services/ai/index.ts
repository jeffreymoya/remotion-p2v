import { execSync, exec as rawExec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

import type {
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
} from "@/src/lib/ai-types";
import { aiLogger as dbAILogger } from "./ai-logger";
import { aiLogger } from "@/src/lib/logger";
import { geminiCall, GEMINI_MODELS, parseGeminiTokenUsage } from "./gemini-wrapper";
import { aiGenerate, type AiOutputFormat, type AiRequest } from "./ai-gateway";
import { parseGeminiOutput } from "@/src/lib/storyflow/gemini-parser";
import { getSettings } from "@/src/lib/storyflow/settings";
import { env } from "@/src/env";

const exec = promisify(rawExec);

/**
 * Simple Gemini CLI backed provider with fallback support.
 * Falls back to returning stdout if JSON parsing fails so the consumer can still attempt to parse.
 */
class GeminiCLIProvider implements AIProvider {
  name = "gemini-cli";
  private readonly config: AIProviderConfig;

  constructor(config?: Partial<AIProviderConfig>) {
    this.config = {
      name: "gemini-cli",
      cliCommand: "gemini",
      defaultModel: env.GEMINI_MODEL || GEMINI_MODELS.FLASH,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // CLI is stateless; nothing to initialize.
  }

  private async executeCommand(model: string, prompt: string): Promise<string> {
    const command = `${this.config.cliCommand} --yolo --model ${model} --output-format json ${JSON.stringify(prompt)}`;
    const { stdout } = await exec(command, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const settings = await getSettings();
    const primaryModel = options?.model || settings.ai.model;

    // Select fallback based on tier: if using proModel, use proFallbackModel
    const isProTier = primaryModel === settings.ai.proModel || primaryModel.includes("-pro");
    const fallbackModel = isProTier ? settings.ai.proFallbackModel : settings.ai.fallbackModel;

    let stdout: string;

    try {
      stdout = await this.executeCommand(primaryModel, prompt);
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
          stdout = await this.executeCommand(fallbackModel, prompt);
          aiLogger.info({ fallbackModel }, "Used fallback model successfully");
        } catch {
          // Both failed, throw the original error
          throw primaryError;
        }
      } else {
        throw primaryError;
      }
    }

    // Gemini CLI returns JSON; try to unwrap common shapes using the
    // robust parser that handles markdown fences, double-escaping, etc.
    try {
      const parsed = parseGeminiOutput<unknown>(stdout);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.output_text === "string") return obj.output_text;
        if (typeof obj.text === "string") return obj.text;
      }
    } catch {
      // Non-JSON output; fall through to raw stdout.
    }

    return stdout.trim();
  }

  async structuredComplete<T>(
    prompt: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const raw = await this.complete(prompt);
    // Allow providers to return either JSON or plain text that needs parsing.
    try {
      const parsed =
        typeof raw === "string" ? parseGeminiOutput<unknown>(raw) : (raw as unknown);
      return schema.parse(parsed);
    } catch (error) {
      throw new Error(
        `[AI] Structured completion failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  setPipelineStage?(stage: string): void {
    void stage; // keep signature for interface; no-op for CLI provider
  }
}

/**
 * Deterministic mock provider for local dev/tests. Generates lightweight
 * responses so the board pipeline can run without an external LLM.
 */
class MockAIProvider implements AIProvider {
  name = "mock-ai";

  async initialize(): Promise<void> {
    // Nothing to init.
  }

  async complete(prompt: string): Promise<string> {
    if (prompt.includes("RETURN FORMAT")) {
      const payload = this.buildTopicBreakPayload(prompt);
      return JSON.stringify(payload);
    }

    if (prompt.includes("Analyze this script segment")) {
      const analysis = {
        topics: ["technology", "ai", "workflow"],
        entities: ["agents", "users", "systems"],
        tone: "narrative",
      };
      return JSON.stringify(analysis);
    }

    if (prompt.includes("Generate descriptions for detective board elements")) {
      const descriptions = this.buildElementDescriptions(prompt);
      return JSON.stringify(descriptions);
    }

    if (prompt.includes("Summarize the main topic")) {
      return this.buildSummary(prompt);
    }

    return "Mock completion response";
  }

  async structuredComplete<T>(
    prompt: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    if (prompt.includes("RETURN FORMAT")) {
      return schema.parse(this.buildTopicBreakPayload(prompt));
    }

    if (prompt.includes("Analyze this script segment")) {
      return schema.parse({
        topics: ["technology", "ai", "workflow"],
        entities: ["agents", "users", "systems"],
        tone: "narrative",
      } as unknown as T);
    }

    if (prompt.includes("Generate descriptions for detective board elements")) {
      return schema.parse(this.buildElementDescriptions(prompt) as unknown as T);
    }

    return schema.parse({} as T);
  }

  setPipelineStage?(stage: string): void {
    void stage; // keep signature for interface compatibility
  }

  private buildTopicBreakPayload(prompt: string) {
    const segments: Array<{ index: number; text: string }> = [];
    const regex = /\[(\d+)\]\s+([^\n]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(prompt))) {
      segments.push({ index: Number(match[1]), text: match[2].trim() });
    }

    const breakAfter =
      segments.length > 1
        ? segments[Math.floor(segments.length / 2)].index
        : null;

    return {
      topicBreaks:
        breakAfter !== null
          ? [
              {
                afterSegmentIndex: breakAfter,
                reason: "Mock topic break",
                confidence: 0.6,
              },
            ]
          : [],
      segmentSummaries: segments.slice(0, 3).map((s) => ({
        index: s.index,
        topic: s.text.slice(0, 60) || "Segment",
      })),
    };
  }

  private buildSummary(prompt: string) {
    const lines = prompt
      .split("\n")
      .filter(
        (line) =>
          line.trim() &&
          !line.startsWith("Summarize") &&
          !line.startsWith("SEGMENTS:")
      );
    const text = lines.slice(-3).join(" ").trim();
    return text
      ? text
          .replace(/---/g, " ")
          .split(" ")
          .filter(Boolean)
          .slice(0, 10)
          .join(" ")
      : "Mock summary";
  }

  private buildElementDescriptions(prompt: string) {
    const ids = Array.from(prompt.matchAll(/(elem-\d+)/g)).map((m) => m[1]);
    return ids.map((id, idx) => ({
      id,
      description: `Mock description for ${id} focusing on topic ${
        idx + 1
      }. Include a clear subject and background.`,
      label: `Note ${idx + 1}`,
      connections: ids.filter((other) => other !== id).slice(0, 2),
    }));
  }
}

/**
 * Factory returning the preferred provider with sane fallbacks.
 */
export class AIProviderFactory {
  static async getProviderWithFallback(): Promise<AIProvider> {
    const preferred = env.BOARDS_AI_PROVIDER || env.AI_PROVIDER;

    if (preferred === "gemini" || preferred === "cli") {
      if (this.hasCommand("gemini")) {
        return new GeminiCLIProvider();
      }
      aiLogger.warn({ preferred }, "Gemini CLI requested but not available; falling back to mock");
    }

    aiLogger.warn("Using mock provider for boards pipeline");
    return new MockAIProvider();
  }

  private static hasCommand(command: string): boolean {
    try {
      execSync(`command -v ${command}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

export type { AIProvider } from "@/src/lib/ai-types";
export { dbAILogger as aiLogger, geminiCall, GEMINI_MODELS, parseGeminiTokenUsage };
export { aiGenerate, AiOutputFormat, AiRequest };
