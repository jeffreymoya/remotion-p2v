import { getCurrentRunTree } from "langsmith/traceable";

export interface SpanMeta {
  slug: string;
  topic: string;
  segmentIndex?: number;
  chapterRole?: "open" | "build" | "complicate" | "turn" | "land";
  phase:
    | "research"
    | "narration"
    | "tts"
    | "videos"
    | "artdirect"
    | "compose"
    | "refine"
    | "proofread";
  provider?:
    | "deepseek"
    | "openrouter"
    | "grok"
    | "llm"
    | "elevenlabs"
    | "google-tts"
    | "pixabay"
    | "pexels"
    | "exa"
    | "serper";
  cacheHit?: boolean;
  revisionNumber?: number;
  fallbackUsed?: string;
  gatePass?: boolean;
  errorType?: "zod_parse" | "json_parse" | "rate_limit" | "max_tokens" | "empty_response" | "timeout" | "api_error" | "unknown";
}

export function buildTags(meta: Partial<SpanMeta>): string[] {
  const tags: string[] = [];
  if (meta.phase) tags.push(`phase:${meta.phase}`);
  if (meta.provider) tags.push(`provider:${meta.provider}`);
  if (meta.cacheHit !== undefined) tags.push(`cache_hit:${meta.cacheHit}`);
  if (meta.fallbackUsed) tags.push(`fallback_used:${meta.fallbackUsed}`);
  if (meta.chapterRole) tags.push(`chapter_role:${meta.chapterRole}`);
  if (meta.gatePass !== undefined) tags.push(`gate_pass:${meta.gatePass}`);
  if (meta.segmentIndex !== undefined) tags.push(`segment:${meta.segmentIndex}`);
  if (meta.errorType) tags.push(`error:${meta.errorType}`);
  return tags;
}

/**
 * Enrich the current LangSmith run tree with canonical metadata and tags.
 * No-ops safely when tracing is disabled or no active run exists.
 */
export function enrichCurrentRun(meta: Partial<SpanMeta>): void {
  const run = getCurrentRunTree(true);
  if (!run) return;

  if (meta.phase) {
    const history = (run.metadata?.phase_history as string[] | undefined) ?? [];
    run.metadata = { ...run.metadata, ...meta, phase_history: [...history, meta.phase] };
  } else {
    run.metadata = { ...run.metadata, ...meta };
  }

  const newTags = buildTags(meta);
  if (newTags.length > 0) {
    const existing = run.tags ?? [];
    // Phase tags replace rather than accumulate so failure location is deterministic via MCP filter
    const incomingPhase = newTags.filter(t => t.startsWith("phase:"));
    const otherNew = newTags.filter(t => !t.startsWith("phase:"));
    const base = incomingPhase.length > 0 ? existing.filter(t => !t.startsWith("phase:")) : existing;
    run.tags = [...base, ...otherNew, ...incomingPhase];
  }
}
