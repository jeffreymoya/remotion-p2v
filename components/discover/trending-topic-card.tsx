"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, PlusCircle, Sparkles, TrendingUp } from "lucide-react";
import { GeneralizedTrendingTopic, TopicSuggestion } from "@/src/lib/storyflow/discovery";

type Props = {
  topic: GeneralizedTrendingTopic;
  onCreateProject: (suggestion: TopicSuggestion, originalTrend: string) => void;
  creatingSuggestionId: string | null;
};

export function TrendingTopicCard({ topic, onCreateProject, creatingSuggestionId }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm shadow-black/30 overflow-hidden">
      {/* Header - Original Trend */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>

        {topic.picture && (
          <img
            src={topic.picture}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-white truncate">{topic.originalTrend}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            {topic.traffic && (
              <span className="rounded-full border border-amber-600/50 bg-amber-500/10 px-2 py-0.5 text-amber-100">
                {topic.traffic}
              </span>
            )}
            <span>{topic.suggestions.length} suggestions</span>
          </div>
        </div>
      </button>

      {/* News Headlines Preview */}
      {expanded && topic.newsHeadlines.length > 0 && (
        <div className="px-4 pb-2 border-b border-slate-800/50">
          <div className="text-xs text-slate-500 mb-1">Related news:</div>
          <div className="space-y-1">
            {topic.newsHeadlines.slice(0, 2).map((headline, idx) => (
              <div key={idx} className="text-xs text-slate-400 truncate">
                {headline}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {expanded && (
        <div className="divide-y divide-slate-800/50">
          {topic.suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-brand-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white leading-tight">
                    {suggestion.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs rounded-full border border-brand-600/50 bg-brand-500/10 px-2 py-0.5 text-brand-200">
                      {suggestion.angle}
                    </span>
                    <span className="text-xs text-slate-500">
                      Score: {suggestion.viralPotential}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
                <button
                  onClick={() => onCreateProject(suggestion, topic.originalTrend)}
                  disabled={creatingSuggestionId === suggestion.id}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {creatingSuggestionId === suggestion.id ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
