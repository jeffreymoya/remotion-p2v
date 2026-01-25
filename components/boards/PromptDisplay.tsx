"use client";

import { useState } from "react";
import { BoardPrompt } from "@/src/lib/boards-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/utils";

interface PromptDisplayProps {
  prompts: BoardPrompt[];
  className?: string;
}

export function PromptDisplay({ prompts, className }: PromptDisplayProps) {
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!prompts.length) {
    return (
      <div className={cn("rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-center", className)}>
        <p className="text-sm text-slate-400">No prompts generated yet</p>
      </div>
    );
  }

  const safeIndex = Math.min(selectedPromptIndex, prompts.length - 1);
  const selectedPrompt = prompts[safeIndex];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Board Selector */}
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={prompt.boardId}
            size="sm"
            variant={index === selectedPromptIndex ? "default" : "outline"}
            onClick={() => setSelectedPromptIndex(index)}
          >
            {prompt.boardId}
          </Button>
        ))}
      </div>

      {/* Selected Prompt Details */}
      {selectedPrompt && (
        <div className="space-y-4">
          {/* Grid Layout Info */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Layout Configuration</h3>
              <span className="text-xs text-slate-400">
                {selectedPrompt.gridLayout.cols} × {selectedPrompt.gridLayout.rows} grid
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Style Guide:</span>
                <span className="rounded bg-slate-900/70 px-2 py-1 font-medium">
                  {selectedPrompt.styleGuide}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Elements:</span>
                <span className="rounded bg-slate-900/70 px-2 py-1 font-medium">
                  {selectedPrompt.elements.length} items
                </span>
              </div>
            </div>
          </div>

          {/* Full Prompt Text (Main Copy Target) */}
          <div className="rounded-lg border border-brand-500/30 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-300">AI Image Generation Prompt</h3>
              <Button
                size="sm"
                variant={copiedId === selectedPrompt.boardId ? "secondary" : "default"}
                onClick={() => handleCopy(selectedPrompt.fullPromptText, selectedPrompt.boardId)}
              >
                {copiedId === selectedPrompt.boardId ? "Copied!" : "Copy Prompt"}
              </Button>
            </div>
            <div className="rounded-md bg-slate-900/80 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-200">
                {selectedPrompt.fullPromptText}
              </pre>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Copy this prompt and paste it into DALL-E, Midjourney, Stable Diffusion, or any AI image generator
            </p>
          </div>

          {/* Element Breakdown */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Elements Breakdown</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {selectedPrompt.elements.map((element) => (
                <div
                  key={element.id}
                  className="rounded-md border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                        {element.type}
                      </span>
                      {element.label && (
                        <span className="text-xs font-medium text-slate-300">{element.label}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      ({element.gridPosition.row},{element.gridPosition.col})
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{element.description}</p>
                  {element.connectionTo && element.connectionTo.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                      <span>→ Connected to:</span>
                      <span className="font-medium text-brand-400">
                        {element.connectionTo.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Segment Contexts */}
          {selectedPrompt.segmentContexts && selectedPrompt.segmentContexts.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Segment Contexts</h3>
              <div className="space-y-2">
                {selectedPrompt.segmentContexts.map((context, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Segment {context.segmentIndex}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Focus: <span className="font-medium text-brand-400">{context.focusElementId}</span>
                      </span>
                    </div>
                    <p className="text-xs italic leading-relaxed text-slate-400">"{context.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
