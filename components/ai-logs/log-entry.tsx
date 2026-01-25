"use client";

import { useState } from "react";
import type { AiCallLog } from "@/src/generated/storyflow";
import { ChevronDown, ChevronRight, Clock, Zap } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface LogEntryProps {
  log: AiCallLog;
  onClick?: () => void;
}

export function LogEntry({ log, onClick }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onClick?.();
  };

  const durationSeconds = log.durationMs ? (log.durationMs / 1000).toFixed(2) : "—";
  const totalTokens = (log.promptTokens ?? 0) + (log.responseTokens ?? 0);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 transition hover:border-slate-700">
      <button
        onClick={handleToggle}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={log.status} />
            <span className="text-sm font-semibold text-white">{log.operation}</span>
            {log.model && (
              <span className="text-xs text-slate-500">• {log.model}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(log.startedAt).toLocaleString()}
            </span>
            {log.durationMs && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {durationSeconds}s
              </span>
            )}
            {totalTokens > 0 && (
              <span>{totalTokens.toLocaleString()} tokens</span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t border-slate-800 p-4">
          <CollapsibleSection title="Prompt" defaultOpen>
            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
              {log.prompt}
            </pre>
          </CollapsibleSection>

          {log.response && (
            <CollapsibleSection title="Response" defaultOpen>
              <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
                {log.response}
              </pre>
            </CollapsibleSection>
          )}

          {log.errorMessage && (
            <div className="rounded-lg border border-rose-800/50 bg-rose-950/30 p-3">
              <p className="text-sm font-semibold text-rose-200">Error</p>
              {log.errorCode && (
                <p className="mt-1 text-xs text-rose-300">
                  Code: {log.errorCode}
                </p>
              )}
              <p className="mt-2 text-sm text-rose-100">{log.errorMessage}</p>
            </div>
          )}

          {log.metadata && typeof log.metadata === "object" && Object.keys(log.metadata).length > 0 && (
            <CollapsibleSection title="Metadata">
              <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}
