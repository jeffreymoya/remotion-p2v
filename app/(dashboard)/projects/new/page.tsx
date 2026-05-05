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

const visualFormatOptions = [
  {
    value: "corkboard",
    label: "Corkboard",
    description: "Investigation",
    enabled: true,
  },
  { value: "whiteboard", label: "Whiteboard", enabled: false },
  { value: "editorial", label: "Editorial", enabled: false },
  { value: "dataviz", label: "Data Viz", enabled: false },
  { value: "minimalist", label: "Minimalist", enabled: false },
] as const;

const styleThemeOptions = [
  { value: "noir-detective", label: "Noir Detective", enabled: true },
  { value: "academic-research-wall", label: "Academic", enabled: false },
  { value: "vintage-scrapbook", label: "Vintage", enabled: false },
  { value: "modern-digital-pinboard", label: "Digital", enabled: false },
  { value: "crime-procedural-tv", label: "Procedural", enabled: false },
] as const;

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [visualFormat, setVisualFormat] = useState("corkboard");
  const [styleTheme, setStyleTheme] = useState("noir-detective");
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
        body: JSON.stringify({
          name,
          topic,
          aspectRatio,
          visualFormat,
          styleTheme,
        }),
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
          <p className="text-sm text-muted-foreground">
            Name your project, set a topic for AI scripting, and choose an
            aspect ratio.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Topic</label>
            <textarea
              value={topic}
              data-testid="new-project-topic"
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
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
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500/10"
                    aria-label={`Use topic suggestion: ${suggestion}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Topic seeds the Script stage and unlocks the rest of the pipeline.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Visual format
            </label>
            <div
              className="grid gap-2 sm:grid-cols-2"
              data-testid="new-project-visual-format"
            >
              {visualFormatOptions.map((option) => {
                const selected = visualFormat === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!option.enabled}
                    aria-pressed={selected}
                    onClick={() => setVisualFormat(option.value)}
                    className={`flex min-h-16 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-brand-500 bg-brand-500/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    } ${
                      option.enabled
                        ? "hover:-translate-y-0.5 hover:border-brand-500"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {option.label}
                      </span>
                      {"description" in option && (
                        <span className="block text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {!option.enabled && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {visualFormat === "corkboard" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Style theme
              </label>
              <div
                className="flex flex-wrap gap-2"
                data-testid="new-project-style-theme"
              >
                {styleThemeOptions.map((option) => {
                  const selected = styleTheme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!option.enabled}
                      aria-pressed={selected}
                      onClick={() => setStyleTheme(option.value)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-brand-500 bg-brand-500/10 text-foreground"
                          : "border-border bg-card text-muted-foreground"
                      } ${
                        option.enabled
                          ? "hover:-translate-y-0.5 hover:border-brand-500"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <span>{option.label}</span>
                      {!option.enabled && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Project name
            </label>
            <input
              value={name}
              data-testid="new-project-name"
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
              placeholder="My first StoryFlow project"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Aspect ratio
            </label>
            <select
              value={aspectRatio}
              data-testid="new-project-aspect-ratio"
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground shadow-inner shadow-black/20 focus:border-brand-500 focus:outline-none"
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
              data-testid="new-project-submit"
              disabled={submitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
