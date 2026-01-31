import { AiCallStatus } from "@/src/generated/storyflow";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { toJsonObject } from "@/src/lib/storyflow/prisma-json";
import type { Milliseconds } from "@/src/lib/types/units";
import { ms } from "@/src/lib/types/units";

export interface AiCallContext {
  projectId: string;
  provider: string;
  model?: string;
  operation: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AiCallResult<T> {
  data: T;
  logId: string;
  durationMs: Milliseconds;
  tokens?: { prompt: number; response: number };
  rawResponse?: string;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function categorizeError(error: unknown): string {
  const msg =
    error instanceof Error ? error.message.toLowerCase() : `${error}`.toLowerCase();
  if (msg.includes("rate limit")) return "RATE_LIMIT";
  if (msg.includes("timeout")) return "TIMEOUT";
  if (msg.includes("parse") || msg.includes("json")) return "PARSE_ERROR";
  if (msg.includes("network")) return "NETWORK_ERROR";
  return "UNKNOWN";
}

class AiLogger {
  private notifyCallbacks: Set<(logId: string) => void> = new Set();

  onNewLog(callback: (logId: string) => void): () => void {
    this.notifyCallbacks.add(callback);
    return () => this.notifyCallbacks.delete(callback);
  }

  private notify(logId: string) {
    this.notifyCallbacks.forEach((cb) => cb(logId));
  }

  async wrap<T>(
    context: AiCallContext,
    prompt: string,
    executor: () => Promise<{ result: T; rawResponse: string; tokens?: { prompt: number; response: number } }>
  ): Promise<AiCallResult<T>> {
    const startedAt = new Date();

    const log = await storyflowPrisma.aiCallLog.create({
      data: {
        projectId: context.projectId,
        provider: context.provider,
        model: context.model,
        operation: context.operation,
        parentId: context.parentId,
        prompt,
        promptTokens: estimateTokens(prompt),
        status: AiCallStatus.PENDING,
        startedAt,
        metadata: toJsonObject(context.metadata),
      },
    });

    this.notify(log.id);

    try {
      const { result, rawResponse, tokens } = await executor();
      const completedAt = new Date();
      const durationMs = ms(completedAt.getTime() - startedAt.getTime());

      await storyflowPrisma.aiCallLog.update({
        where: { id: log.id },
        data: {
          status: AiCallStatus.COMPLETED,
          response: rawResponse,
          responseTokens: tokens?.response ?? estimateTokens(rawResponse),
          promptTokens: tokens?.prompt ?? log.promptTokens,
          completedAt,
          durationMs,
        },
      });

      this.notify(log.id);

      return { data: result, logId: log.id, durationMs, tokens, rawResponse };
    } catch (error) {
      const completedAt = new Date();
      const durationMs = ms(completedAt.getTime() - startedAt.getTime());

      await storyflowPrisma.aiCallLog.update({
        where: { id: log.id },
        data: {
          status: AiCallStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : `${error}`,
          errorCode: categorizeError(error),
          completedAt,
          durationMs,
        },
      });

      this.notify(log.id);
      throw error;
    }
  }
}

export const aiLogger = new AiLogger();
