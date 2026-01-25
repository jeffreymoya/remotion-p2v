"use client";

import { useState, useMemo } from "react";
import type { AiCallStatus } from "@/src/generated/storyflow";
import { StatsCards } from "./stats-cards";
import { Filters } from "./filters";
import { LogEntry } from "./log-entry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAiLogs } from "@/src/hooks/queries/use-ai-logs";

interface AiLogsClientProps {
  projectId: string;
}

export function AiLogsClient({ projectId }: AiLogsClientProps) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<AiCallStatus | "all">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  // React Query hook with smart polling
  const { data, isLoading, error } = useAiLogs(projectId, statusFilter, providerFilter);

  const logs = data?.logs ?? [];
  const stats = data?.stats.summary ?? {
    totalCalls: 0,
    successRate: 0,
    avgLatency: 0,
    totalTokens: 0,
    pendingCalls: 0,
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setProviderFilter("all");
  };

  const errorLogs = useMemo(
    () => logs.filter((log) => log.status === "FAILED"),
    [logs]
  );

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="errors">
            Errors ({errorLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Filters
            status={statusFilter}
            provider={providerFilter}
            onStatusChange={setStatusFilter}
            onProviderChange={setProviderFilter}
            onReset={handleResetFilters}
          />

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <div>
                  <p className="font-semibold text-rose-200">Error loading logs</p>
                  <p className="mt-1 text-sm text-rose-300">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No AI call logs found</p>
            </div>
          )}

          {!isLoading && !error && logs.length > 0 && (
            <div className="space-y-2">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {errorLogs.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No errors found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errorLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
