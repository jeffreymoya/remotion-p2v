import { traceable, getCurrentRunTree } from "langsmith/traceable";
import type { ZodType } from "zod";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, DEEPSEEK_TIMEOUT_MS } from "./config";
import { enrichCurrentRun } from "./tracing";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ReasoningConfig {
  effort: string;
  thinking: { type: "enabled" | "disabled" };
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>;
}

export interface DeepSeekOptions {
  verbose?: boolean;
  metadata?: Record<string, unknown>;
  maxTokens?: number;
  timeoutMs?: number;
  /** Custom run name shown in LangSmith trace waterfall (e.g. "narration", "proofread/escalation"). */
  runName?: string;
}

export class DeepSeekError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

async function deepseekChatImpl(
  messages: DeepSeekMessage[],
  temperature: number,
  reasoning: ReasoningConfig,
  options?: DeepSeekOptions,
): Promise<string> {
  const verbose = options?.verbose ?? false;
  const metadata = options?.metadata;
  const maxTokens = options?.maxTokens;
  const timeoutMs = options?.timeoutMs ?? DEEPSEEK_TIMEOUT_MS;
  const runName = options?.runName;
  const startTime = Date.now();

  const run = getCurrentRunTree(true);
  if (run) {
    if (runName) run.name = runName;
    if (metadata) run.metadata = { ...run.metadata, ...metadata };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekError("DEEPSEEK_API_KEY environment variable is not set");
  }

  if (verbose) {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    process.stderr.write(
      `[deepseek] model=${DEEPSEEK_MODEL} temp=${temperature} reasoning_effort=${reasoning.effort} thinking=${reasoning.thinking.type} msgs=${messages.length} chars=${totalChars}\n`,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
        ...(reasoning.thinking.type === "enabled"
          ? { reasoning_effort: reasoning.effort, thinking: { type: "enabled" } }
          : { thinking: { type: "disabled" } }),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new DeepSeekError(`DeepSeek request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DeepSeekError(
      `DeepSeek API error (${response.status}): ${text.slice(0, 500)}`,
      response.status,
    );
  }

  const json: DeepSeekResponse = (await response.json()) as DeepSeekResponse;

  // Extract token usage for LangSmith cost analytics
  const usage = (json as DeepSeekResponse & { usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }).usage;
  if (run && usage) {
    run.extra = {
      ...run.extra,
      usage_metadata: {
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
    };
  }
  enrichCurrentRun({ provider: "deepseek" });

  const content = json.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new DeepSeekError("DeepSeek returned an empty response");
  }

  if (verbose) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stderr.write(
      `[deepseek] done (${content.length} chars, ${elapsed}s)\n`,
    );
  }

  return content;
}

export const deepseekChat = traceable(deepseekChatImpl, {
  name: "deepseekChat",
  run_type: "llm",
});

// ── JSON-mode wrapper ────────────────────────────────────────────────────

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

async function deepseekChatJsonImpl<T>(
  messages: DeepSeekMessage[],
  schema: ZodType<T>,
  temperature: number,
  reasoning: ReasoningConfig,
  options?: DeepSeekOptions,
): Promise<T> {
  const verbose = options?.verbose ?? false;
  const metadata = options?.metadata;
  const maxTokens = options?.maxTokens;
  const timeoutMs = options?.timeoutMs ?? DEEPSEEK_TIMEOUT_MS;
  const runName = options?.runName;
  const startTime = Date.now();

  const run = getCurrentRunTree(true);
  if (run) {
    if (runName) run.name = runName;
    if (metadata) run.metadata = { ...run.metadata, ...metadata };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekError("DEEPSEEK_API_KEY environment variable is not set");
  }

  if (verbose) {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    process.stderr.write(
      `[deepseek/json] model=${DEEPSEEK_MODEL} temp=${temperature} msgs=${messages.length} chars=${totalChars}\n`,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        response_format: { type: "json_object" },
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
        ...(reasoning.thinking.type === "enabled"
          ? { reasoning_effort: reasoning.effort, thinking: { type: "enabled" } }
          : { thinking: { type: "disabled" } }),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new DeepSeekError(`DeepSeek JSON request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DeepSeekError(
      `DeepSeek API error (${response.status}): ${text.slice(0, 500)}`,
      response.status,
    );
  }

  const json: DeepSeekResponse = (await response.json()) as DeepSeekResponse;

  // Extract token usage for LangSmith cost analytics
  const jsonUsage = (json as DeepSeekResponse & { usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }).usage;
  if (run && jsonUsage) {
    run.extra = {
      ...run.extra,
      usage_metadata: {
        input_tokens: jsonUsage.prompt_tokens,
        output_tokens: jsonUsage.completion_tokens,
        total_tokens: jsonUsage.total_tokens,
      },
    };
  }
  enrichCurrentRun({ provider: "deepseek" });

  const content = json.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new DeepSeekError("DeepSeek returned an empty JSON response");
  }

  if (verbose) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stderr.write(
      `[deepseek/json] done (${content.length} chars, ${elapsed}s)\n`,
    );
  }

  const cleaned = stripJsonFences(content);
  const parsed: unknown = JSON.parse(cleaned);
  return schema.parse(parsed);
}

const deepseekChatJsonTraceable = traceable(deepseekChatJsonImpl, {
  name: "deepseekChatJson",
  run_type: "llm",
});

export const deepseekChatJson = deepseekChatJsonTraceable as typeof deepseekChatJsonImpl;
