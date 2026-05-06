import axios from "axios";
import type { DeepSeekCallOptions, DeepSeekMessage } from "./types";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-v4-pro";

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
  }
  return key;
}

function buildMessages(prompt: string, systemPrompt?: string): DeepSeekMessage[] {
  const messages: DeepSeekMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });
  return messages;
}

export async function deepseekCall(
  prompt: string,
  options: DeepSeekCallOptions,
  systemPrompt?: string
): Promise<string> {
  const apiKey = getApiKey();
  const messages = buildMessages(prompt, systemPrompt);

  const response = await axios.post<DeepSeekResponse>(
    `${DEEPSEEK_BASE_URL}/chat/completions`,
    {
      model: DEEPSEEK_MODEL,
      messages,
      reasoning_effort: options.effort,
      max_tokens: 120_000,
      extra_body: { thinking: { type: "enabled" } },
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 600_000,
    }
  );

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned empty response content");
  }

  return content;
}
