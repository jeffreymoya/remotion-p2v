"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { useToast } from "@/components/ui/toast-provider";

const ratios = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Vertical)" },
];

const topicSuggestions = [
  "AI co-pilots for classroom teachers",
  "How to prototype with multimodal tools",
  "Sustainable tiny homes for cities",
  "What creators need to know about synthetic media laws",
  "Turning podcast clips into short-form video",
  "Designing with motion-first storyboards",
  "Inclusive voiceover practices",
  "Breaking down viral explainer formats",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, topic, aspectRatio }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body.error === "string"
            ? body.error
            : Array.isArray(body.error?.topic)
              ? body.error.topic[0]
              : Array.isArray(body.error?.name)
                ? body.error.name[0]
              : "Unable to create project";
        setError(message);
        return;
      }

      toast({
        title: "Project created",
        description: name,
        variant: "success",
      });
      router.push("/projects");
    } catch (err) {
      console.error(err);
      setError("Network error creating project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">New Project</h1>
          <p className="text-sm text-slate-400">
            Name your project, set a topic for AI scripting, and choose an aspect ratio.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
              placeholder="e.g. How AI copilots speed up editing"
              rows={3}
              required
            />
            {topicSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topicSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTopic(suggestion)}
                    className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500/10"
                    aria-label={`Use topic suggestion: ${suggestion}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">
              Topic seeds the Script stage and unlocks the rest of the pipeline.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Project name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
              placeholder="My first StoryFlow project"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Aspect ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
            >
              {ratios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-slate-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
