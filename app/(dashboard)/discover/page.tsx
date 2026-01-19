"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { useToast } from "@/components/ui/toast-provider";
import { TrendingTopicCard } from "@/components/discover/trending-topic-card";
import { GeneralizedTrendingTopic, TopicSuggestion } from "@/src/lib/storyflow/discovery";

const ASPECT_OPTIONS = ["16:9", "9:16"] as const;

export default function DiscoverPage() {
  const router = useRouter();
  const toast = useToast();
  const [topics, setTopics] = useState<GeneralizedTrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSuggestionId, setCreatingSuggestionId] = useState<string | null>(null);
  const [manualTopic, setManualTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_OPTIONS)[number]>("16:9");

  const loadAndGenerateTopics = useCallback(async () => {
    setLoading(true);
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/discover/generalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionsPerTopic: 4 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to generate topics");
      }
      const json = await res.json();
      setTopics(json.trendingTopics ?? []);
      if (json.trendingTopics?.length > 0) {
        toast({
          title: "Topics generated",
          description: `${json.totalSuggestions} video ideas from ${json.totalTrends} trends`,
          variant: "success",
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to generate topics. Try again.");
      setTopics([]);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [toast]);

  const createProjectFromSuggestion = async (suggestion: TopicSuggestion, originalTrend: string) => {
    setCreatingSuggestionId(suggestion.id);
    try {
      const name = suggestion.title.slice(0, 100);
      const topic = `${suggestion.title}\n\nAngle: ${suggestion.angle}\n\n${suggestion.description}\n\nOriginal trend: ${originalTrend}`;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          topic: topic.slice(0, 1000),
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.topic?.[0] ||
              body.error?.name?.[0] ||
              "Unable to create project";
        toast({ title: detail, variant: "error" });
        return;
      }

      const { project } = await res.json();
      toast({
        title: "Project created",
        description: project.name,
        variant: "success",
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Network error creating project", variant: "error" });
    } finally {
      setCreatingSuggestionId(null);
    }
  };

  const createManualProject = async () => {
    const topic = manualTopic.trim();
    if (!topic) {
      toast({ title: "Topic required", variant: "error" });
      return;
    }

    setCreatingSuggestionId("manual");
    try {
      const name = topic.slice(0, 100);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          topic: topic.slice(0, 500),
          aspectRatio,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : body.error?.topic?.[0] ||
              body.error?.name?.[0] ||
              "Unable to create project";
        toast({ title: detail, variant: "error" });
        return;
      }

      const { project } = await res.json();
      toast({
        title: "Project created",
        description: project.name,
        variant: "success",
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Network error creating project", variant: "error" });
    } finally {
      setCreatingSuggestionId(null);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Discover Topics</h1>
          <p className="text-sm text-slate-400">
            Generate video ideas from Google Trends with AI-powered topic suggestions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300">
            Aspect ratio
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as "16:9" | "9:16")}
              className="ml-2 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-sm text-white"
            >
              {ASPECT_OPTIONS.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <button
            onClick={loadAndGenerateTopics}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
            disabled={loading || generating}
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Ideas
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-brand-600/10 p-2 text-brand-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-white">Manual topic</span>
              <span className="rounded-full border border-slate-800 px-2 py-0.5 text-xs text-slate-300">
                Or enter your own idea
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={manualTopic}
                onChange={(e) => setManualTopic(e.target.value)}
                placeholder="AI video ideas, e.g. 'Latest breakthroughs in fusion energy'"
                className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
              />
              <button
                onClick={createManualProject}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={!manualTopic.trim() || creatingSuggestionId !== null}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {!loading && topics.length === 0 && !error && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <Wand2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Ready to discover?</h3>
          <p className="text-sm text-slate-400 mb-4">
            Click &quot;Generate Ideas&quot; to fetch trending topics and get AI-powered video suggestions.
          </p>
        </div>
      )}

      {loading && <TopicsSkeleton />}

      {error && (
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!loading && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic) => (
            <TrendingTopicCard
              key={topic.id}
              topic={topic}
              onCreateProject={createProjectFromSuggestion}
              creatingSuggestionId={creatingSuggestionId}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function TopicsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner animate-pulse"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-slate-700 rounded" />
            <div className="w-12 h-12 bg-slate-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-700 rounded w-48 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-24" />
            </div>
          </div>
          <div className="border-t border-slate-800/50 p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, sIdx) => (
              <div key={sIdx} className="flex gap-3">
                <div className="w-4 h-4 bg-slate-700 rounded mt-1" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
