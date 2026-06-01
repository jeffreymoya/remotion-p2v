import { traceable, getCurrentRunTree } from "langsmith/traceable";

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
    | "serper"
    | "firecrawl";
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
 * Thin factory for the common `traceable({ run_type: "chain", name })` pattern.
 * Collapses 17 copy-paste blocks into one line per call site.
 */
export function traceableChain<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  opts?: {
    processInputs?: (inputs: Record<string, unknown>) => Record<string, unknown>;
    processOutputs?: (outputs: Record<string, unknown>) => Record<string, unknown>;
  },
): T {
  return traceable(fn, {
    run_type: "chain" as const,
    name,
    ...opts,
  }) as T;
}

/**
 * Recursively strip asset payloads and asset references from trace inputs/outputs.
 * Keeps text, counts, statuses, safe metadata, and research/diagnostic URLs;
 * redacts buffers, base64 payloads, media-file URLs, local asset paths,
 * secrets, and API keys.
 */
export function textOnlyAssetSummary(value: unknown, _seen = new WeakSet<object>(), _depth = 0): unknown {
  if (_depth > 20) return "(max depth)";
  if (Buffer.isBuffer(value)) return { kind: "buffer", byteLength: value.byteLength };
  if (value instanceof ArrayBuffer) return { kind: "arrayBuffer", byteLength: value.byteLength };
  if (ArrayBuffer.isView(value)) return { kind: "typedArray", byteLength: value.byteLength };
  if (typeof value === "string") {
    if (/^data:.*;base64,/i.test(value)) return "(redacted base64 asset)";
    if (/^https?:\/\/.*\.(wav|mp3|mp4|mov|webm|jpg|jpeg|png|webp|gif)(\?|$)/i.test(value)) return "(redacted asset url)";
    if (/(^|\/)public\/(audio|images|videos)\//.test(value)) return "(redacted local asset path)";
    if (/\.(wav|mp3|mp4|mov|webm|jpg|jpeg|png|webp|gif)$/i.test(value)) return "(redacted asset path)";
    if (value.length > 4096 && /^[A-Za-z0-9+/=\r\n]+$/.test(value)) return "(redacted possible base64 payload)";
  }
  if (Array.isArray(value)) return value.map((v) => textOnlyAssetSummary(v, _seen, _depth + 1));
  if (value && typeof value === "object") {
    if (_seen.has(value as object)) return "(circular)";
    _seen.add(value as object);
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (/\b(apiKey|authorization|token|secret|header)\b/i.test(key)) continue;
      if (/\b(audioBuffer|buffer|bytes|base64|audioContent|imageContent|videoContent)\b/i.test(key)) {
        out[key] = textOnlyAssetSummary(child, _seen, _depth + 1);
        continue;
      }
      if (/\b(path|url|sourceUrl|videoPath|imagePath|manifest)\b/i.test(key)) {
        out[key] = "(redacted asset reference)";
        continue;
      }
      out[key] = textOnlyAssetSummary(child, _seen, _depth + 1);
    }
    return out;
  }
  return value;
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
