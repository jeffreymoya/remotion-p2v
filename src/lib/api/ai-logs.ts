import type { AiCallLog, AiCallStatus } from "@/src/generated/storyflow";

export interface Stats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  pendingCalls: number;
}

export interface LogsResponse {
  logs: AiCallLog[];
  stats: {
    summary: Stats;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface FetchAiLogsParams {
  projectId: string;
  status?: AiCallStatus | "all";
  provider?: string;
  limit?: number;
}

export async function fetchAiLogs({
  projectId,
  status = "all",
  provider = "all",
  limit = 100,
}: FetchAiLogsParams): Promise<LogsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status !== "all") params.set("status", status);
  if (provider !== "all") params.set("provider", provider);

  const response = await fetch(`/api/projects/${projectId}/ai-logs?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch logs");
  }

  return response.json();
}
