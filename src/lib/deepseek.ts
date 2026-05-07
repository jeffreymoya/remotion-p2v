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
): Promise<string> {
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

  const json: DeepSeekResponse = await response.json() as DeepSeekResponse;

  const content = json.choices?.[0]?.message?.content;
  if (!content || content.trim().length === 0) {
    throw new DeepSeekError("DeepSeek returned an empty response");
  }

  return content;
}
