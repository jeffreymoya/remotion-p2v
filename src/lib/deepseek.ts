import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL } from "./config";

interface DeepSeekMessage {
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
  onChunk?: (text: string) => void;
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

export async function deepseekChat(
  messages: DeepSeekMessage[],
  temperature: number,
  reasoning: ReasoningConfig,
  options?: DeepSeekOptions,
): Promise<string> {
  const verbose = options?.verbose ?? false;
  const onChunk = options?.onChunk;
  const startTime = Date.now();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekError("DEEPSEEK_API_KEY environment variable is not set");
  }

  const url = `${DEEPSEEK_BASE_URL}/chat/completions`;

  const body: Record<string, unknown> = {
    model: DEEPSEEK_MODEL,
    messages,
    temperature,
    reasoning_effort: reasoning.effort,
  };

  if (reasoning.thinking.type === "enabled") {
    body.thinking = { type: "enabled" };
  }

  if (onChunk) {
    body.stream = true;
  }

  if (verbose) {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    process.stderr.write(
      `[deepseek] model=${DEEPSEEK_MODEL} temp=${temperature} reasoning_effort=${reasoning.effort} thinking=${reasoning.thinking.type} msgs=${messages.length} chars=${totalChars} stream=${onChunk ? "yes" : "no"}\n`
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DeepSeekError(
      `DeepSeek API error (${response.status}): ${text.slice(0, 500)}`,
      response.status,
    );
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed: {
            choices?: Array<{ delta?: { content?: string } }>;
          } = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            result += content;
            onChunk(content);
          }
        } catch {
          // skip unparseable SSE lines
        }
      }
    }

    if (!result.trim()) {
      throw new DeepSeekError("DeepSeek returned an empty response");
    }

    if (verbose) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stderr.write(
        `[deepseek] done (${result.length} chars, ${elapsed}s)\n`
      );
    }

    return result;
  }

  const json: DeepSeekResponse = await response.json() as DeepSeekResponse;

  const content = json.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new DeepSeekError("DeepSeek returned an empty response");
  }

  if (verbose) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stderr.write(
      `[deepseek] done (${content.length} chars, ${elapsed}s)\n`
    );
  }

  return content;
}
