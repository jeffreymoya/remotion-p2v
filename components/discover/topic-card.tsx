"use client";

import Link from "next/link";
import { ExternalLink, PlusCircle } from "lucide-react";
import { TrendingTopic } from "@/src/lib/storyflow/discovery";

type Props = {
  topic: TrendingTopic;
  onCreate: () => void;
  creating?: boolean;
};

export function TopicCard({ topic, onCreate, creating }: Props) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/30">
      <div className="flex-1 space-y-2">
        <div className="text-lg font-semibold text-white">{topic.query}</div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {topic.traffic ? (
            <span className="rounded-full border border-amber-600/50 bg-amber-500/10 px-2 py-1 text-amber-100">
              {topic.traffic}
            </span>
          ) : (
            <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">
              New
            </span>
          )}
          {topic.exploreUrl && (
            <Link
              href={topic.exploreUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200"
            >
              Explore <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
      <button
        onClick={onCreate}
        disabled={creating}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <PlusCircle className="h-4 w-4" />
        {creating ? "Creating..." : "Create Project"}
      </button>
    </div>
  );
}
