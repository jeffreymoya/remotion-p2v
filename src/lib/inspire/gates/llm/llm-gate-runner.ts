import type { ZodType } from "zod";
import type { DeepSeekMessage } from "../../../deepseek";
import { deepseekChatJson } from "../../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING, REFINE_MAX_LLM_CALLS_PER_GATE } from "../../../config";

export type ChatFn = <T>(
  messages: DeepSeekMessage[],
  schema: ZodType<T>,
  temperature: number,
  reasoning: typeof NARRATION_REASONING,
) => Promise<T>;

/** Default chat function wrapping the real DeepSeek JSON client. */
const defaultChatFn: ChatFn = <T>(
  messages: DeepSeekMessage[],
  schema: ZodType<T>,
  temperature: number,
  reasoning: typeof NARRATION_REASONING,
): Promise<T> => deepseekChatJson(messages, schema, temperature, reasoning);

/**
 * Per-(chapter, gate) call budget tracker.
 * Resets between chapters by constructing a new tracker.
 */
export class LlmBudgetTracker {
  private readonly counts = new Map<string, number>();

  /** Returns true if the gate has remaining budget. */
  hasRemaining(gateName: string): boolean {
    const used = this.counts.get(gateName) ?? 0;
    return used < REFINE_MAX_LLM_CALLS_PER_GATE;
  }

  /** Record one call for the given gate. */
  record(gateName: string): void {
    const used = this.counts.get(gateName) ?? 0;
    this.counts.set(gateName, used + 1);
  }

  /** Get current count for a gate. */
  getCount(gateName: string): number {
    return this.counts.get(gateName) ?? 0;
  }
}

export interface LlmGateRunnerOptions {
  chatFn?: ChatFn;
  verbose?: boolean;
}

/**
 * Run a single LLM gate call: build messages, call DeepSeek JSON mode, parse via Zod.
 * Returns the parsed result of type T.
 */
export async function runLlmGateCall<T>(
  systemPrompt: string,
  userContent: string,
  schema: ZodType<T>,
  options?: LlmGateRunnerOptions,
): Promise<T> {
  const chat = options?.chatFn ?? defaultChatFn;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  if (options?.verbose) {
    process.stderr.write(
      `[llm-gate] calling DeepSeek JSON mode (system: ${systemPrompt.length} chars, user: ${userContent.length} chars)\n`,
    );
  }

  return chat(messages, schema, CODE_GEN_TEMPERATURE, NARRATION_REASONING);
}
