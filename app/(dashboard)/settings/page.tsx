"use client";

import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useToast } from "@/components/ui/toast-provider";

type Settings = {
  ai: {
    provider: string;
    model: string;
    fallbackModel: string;
    proModel: string;
    proFallbackModel: string;
    temperature: number;
  };
  tts: { voice: string; speakingRate: number; pitch: number };
  render: { defaultQuality: string; defaultAspectRatio: string };
};

const QUALITY_OPTIONS = ["draft", "medium", "high", "production"];
const ASPECT_OPTIONS = ["16:9", "9:16"];
const PROVIDERS = ["gemini-cli", "claude-code"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useToast();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const json = await res.json();
      setSettings(json.settings);
    } catch (err) {
      console.error(err);
      setLoadError("Unable to load settings. Check API and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (!settings) {
    return (
      <PageContainer>
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded-md bg-slate-800" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-slate-900" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-sm text-rose-100">
            <p>{loadError ?? "Unable to load settings."}</p>
            <button
              onClick={loadSettings}
              className="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow hover:-translate-y-0.5"
            >
              Retry
            </button>
          </div>
        )}
      </PageContainer>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Settings saved");
        toast({ title: "Settings saved", variant: "success" });
      } else {
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body.error === "string"
            ? body.error
            : "Failed to save settings";
        setMessage(detail);
        toast({ title: detail, variant: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error saving settings");
      toast({ title: "Network error saving settings", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-slate-400">
            Configure AI, TTS, and rendering defaults.
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold">AI Provider</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Provider</span>
                <select
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.ai.provider}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? { ...s, ai: { ...s.ai, provider: e.target.value } }
                        : s
                    )
                  }
                >
                  {PROVIDERS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Temperature</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={2}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.ai.temperature}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? {
                            ...s,
                            ai: { ...s.ai, temperature: Number(e.target.value) },
                          }
                        : s
                    )
                  }
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Model for basic prompts</span>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  placeholder="e.g. gemini-2.5-flash"
                  value={settings.ai.model}
                  onChange={(e) =>
                    setSettings((s) =>
                      s ? { ...s, ai: { ...s.ai, model: e.target.value } } : s
                    )
                  }
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Fallback for basic prompts</span>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  placeholder="e.g. gemini-2.5-flash"
                  value={settings.ai.fallbackModel}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? { ...s, ai: { ...s.ai, fallbackModel: e.target.value } }
                        : s
                    )
                  }
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Model for complex prompts</span>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  placeholder="e.g. gemini-2.5-pro"
                  value={settings.ai.proModel}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? { ...s, ai: { ...s.ai, proModel: e.target.value } }
                        : s
                    )
                  }
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Fallback for complex prompts</span>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  placeholder="e.g. gemini-2.5-pro"
                  value={settings.ai.proFallbackModel}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? {
                            ...s,
                            ai: { ...s.ai, proFallbackModel: e.target.value },
                          }
                        : s
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold">TTS</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Voice</span>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.tts.voice}
                  onChange={(e) =>
                    setSettings((s) =>
                      s ? { ...s, tts: { ...s.tts, voice: e.target.value } } : s
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Speaking rate</span>
                <input
                  type="number"
                  step="0.1"
                  min={0.5}
                  max={2}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.tts.speakingRate}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? {
                            ...s,
                            tts: { ...s.tts, speakingRate: Number(e.target.value) },
                          }
                        : s
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Pitch</span>
                <input
                  type="number"
                  step="0.5"
                  min={-20}
                  max={20}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.tts.pitch}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? { ...s, tts: { ...s.tts, pitch: Number(e.target.value) } }
                        : s
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/30">
            <h2 className="text-lg font-semibold">Render Defaults</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Default quality</span>
                <select
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.render.defaultQuality}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? {
                            ...s,
                            render: { ...s.render, defaultQuality: e.target.value },
                          }
                        : s
                    )
                  }
                >
                  {QUALITY_OPTIONS.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Default aspect ratio</span>
                <select
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-white"
                  value={settings.render.defaultAspectRatio}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? {
                            ...s,
                            render: {
                              ...s.render,
                              defaultAspectRatio: e.target.value,
                            },
                          }
                        : s
                    )
                  }
                >
                  {ASPECT_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {message && <span className="text-sm text-slate-300">{message}</span>}
        </div>
      </div>
    </PageContainer>
  );
}
