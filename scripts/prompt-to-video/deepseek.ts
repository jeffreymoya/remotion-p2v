import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import type { DeepSeekCallOptions, DeepSeekMessage } from "./types";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-v4-pro";
const LOGS_DIR = path.join("logs", "deepseek");

interface DeepSeekStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    index?: number;
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
  const verbose = options.verbose ?? false;
  const logPrefix = options.logPrefix ?? "deepseek";
  const sanitizedPrefix = logPrefix.replace(/[^a-z0-9-]/gi, "-");
  const logFileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${sanitizedPrefix}.log`;

  await fs.promises.mkdir(LOGS_DIR, { recursive: true });
  const logPath = path.join(LOGS_DIR, logFileName);
  let logStream: fs.WriteStream | null = null;

  if (verbose) {
    logStream = fs.createWriteStream(logPath, { encoding: "utf-8" });
    logStream.write(`=== DeepSeek ${logPrefix} ===\n`);
    logStream.write(`Model: ${DEEPSEEK_MODEL}\n`);
    logStream.write(`Effort: ${options.effort}\n`);
    logStream.write(`Prompt length: ${prompt.length} chars\n`);
    if (systemPrompt) {
      logStream.write(`System prompt length: ${systemPrompt.length} chars\n`);
    }
    logStream.write("--- REQUEST ---\n");
    logStream.write(`${messages.map((m) => `[${m.role}] ${m.content}`).join("\n\n")}\n`);
    logStream.write("--- RESPONSE ---\n");
  }

  try {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages,
        reasoning_effort: options.effort,
        max_tokens: 120_000,
        extra_body: { thinking: { type: "enabled" } },
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 600_000,
        responseType: "stream",
      }
    );

    let content = "";
    let lastLog = Date.now();

    await new Promise<void>((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
        const lines = chunk.toString("utf-8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr) as DeepSeekStreamChunk;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              if (verbose) {
                process.stderr.write(delta);
                if (logStream) logStream.write(delta);
              }
            }
          } catch {
            if (verbose && trimmed.length < 200) {
              process.stderr.write(`\n[deepseek:unparsable] ${trimmed}\n`);
            }
          }
        }

        if (verbose) {
          const now = Date.now();
          if (now - lastLog > 10_000 && content.length > 0) {
            process.stderr.write(
              `\n[deepseek:status] ${content.length} chars so far...\n`
            );
            lastLog = now;
          }
        }
      });

      response.data.on("end", () => {
        if (verbose) {
          process.stderr.write("\n");
          if (logStream) {
            logStream.write("\n--- END RESPONSE ---\n");
            logStream.write(`Total: ${content.length} chars\n`);
            logStream.end();
          }
        }
        resolve();
      });

      response.data.on("error", (err: Error) => {
        if (verbose) {
          process.stderr.write(`\n[deepseek:stream-error] ${err.message}\n`);
          if (logStream) {
            logStream.write(`\n--- STREAM ERROR ---\n${err.message}\n`);
            logStream.end();
          }
        }
        reject(err);
      });
    });

    if (!content) {
      throw new Error("DeepSeek returned empty response content");
    }

    return content;
  } catch (error) {
    if (verbose && logStream) {
      logStream.write(
        `\n--- ERROR ---\n${error instanceof Error ? error.message : String(error)}\n`
      );
      logStream.end();
    }
    throw error;
  }
}
