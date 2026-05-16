import { traceable, getCurrentRunTree } from "langsmith/traceable";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, DEEPSEEK_TIMEOUT_MS } from "./config";

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
  const startTime = Date.now();

  if (metadata) {
    const run = getCurrentRunTree(true);
    if (run) {
      run.metadata = { ...run.metadata, ...metadata };
    }
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

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      ...(reasoning.thinking.type === "enabled"
        ? { reasoning_effort: reasoning.effort, thinking: { type: "enabled" } }
        : { thinking: { type: "disabled" } }),
    }),
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DeepSeekError(
      `DeepSeek API error (${response.status}): ${text.slice(0, 500)}`,
      response.status,
    );
  }

  const json: DeepSeekResponse = (await response.json()) as DeepSeekResponse;

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
