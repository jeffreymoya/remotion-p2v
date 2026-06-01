// Channel-pattern audit (Step 3 / YPP Backlog 3).
//
// The READ counterpart to the variety controller (Deliverable A). The controller
// WRITES a per-video assignment to the variety ledger under rolling-quota
// constraints; this module READS the ledger across the most recent rolling window
// and flags a batch where any single structure/template dominates, then emits an
// actionable Markdown report to run before upload.
//
// Pure: no IO, no clock reads beyond an injectable `generatedAt`. The CLI wrapper
// (`scripts/docu-channel-audit.ts`) loads the ledger + per-slug enrichment and
// writes the report.
//
// Thresholds are reused from the variety controller so the audit verifies against
// exactly the quotas the controller enforces (report P1 §6): a single axis value
// may not exceed `MAX_SAME_ARC_RATIO` of the window, and a full window must carry
// at least `MIN_DISTINCT_ARCS` distinct arcs.

import {
  ARC_AXES,
  OPENER_AXES,
  PACING_AXES,
  SKIN_AXES,
  VOICE_POOL,
  ROLLING_WINDOW,
  MAX_SAME_ARC_RATIO,
  MIN_DISTINCT_ARCS,
  type ArcAxis,
  type OpenerAxis,
  type PacingAxis,
  type SkinAxis,
  type VoiceAxis,
  type VarietyLedgerEntry,
} from "./variety-controller";

// ── Types ─────────────────────────────────────────────────────────────────

/** Per-slug signals the ledger does not carry, read from media artifacts. */
export interface AuditEnrichment {
  /** Number of third-party YouTube clips inserted (`<slug>-clips.json`). */
  youtubeClipCount?: number;
  /** Number of stock images downloaded (`<slug>-images.json`). */
  stockImageCount?: number;
}

export interface AuditInput {
  entries: VarietyLedgerEntry[];
  /** Per-slug media signals; absence of a key is treated as zero. */
  enrichment?: Record<string, AuditEnrichment>;
  /** Window size (default `ROLLING_WINDOW`). */
  window?: number;
  /** Injected timestamp for deterministic reports. */
  generatedAt?: string;
}

export interface AxisCount<T extends string> {
  value: T;
  count: number;
  /** Share of the analyzed window (0–1). */
  share: number;
}

export interface AxisDistribution<T extends string> {
  axis: string;
  counts: AxisCount<T>[];
  distinct: number;
}

export interface AuditFlag {
  axis: string;
  kind: "domination" | "insufficient-variety";
  /** The dominating value (for `domination`). */
  value?: string;
  /** Its share of the window (for `domination`). */
  share?: number;
  /** The threshold breached. */
  threshold: number;
  message: string;
}

export interface ChannelAuditReport {
  generatedAt: string;
  /** Total ledger entries across all time. */
  totalVideos: number;
  /** Entries actually analyzed (the most recent `window`). */
  windowSize: number;
  /** Whether the window is full (`windowSize >= ROLLING_WINDOW`). */
  windowFull: boolean;
  arc: AxisDistribution<ArcAxis>;
  opener: AxisDistribution<OpenerAxis>;
  pacing: AxisDistribution<PacingAxis>;
  voice: AxisDistribution<VoiceAxis>;
  skin: AxisDistribution<SkinAxis>;
  /** Fraction of window videos that inserted ≥1 third-party clip. */
  clipUsageRatio: number;
  /** Stock images / (stock images + clips) across the window; null without enrichment. */
  stockToClipRatio: number | null;
  flags: AuditFlag[];
  recommendations: string[];
  verdict: "pass" | "needs-attention";
}

// ── Distribution + flagging ──────────────────────────────────────────────────

function distributionFor<T extends string>(
  axis: string,
  values: T[],
  pool: readonly T[],
): AxisDistribution<T> {
  const total = values.length;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  const ordered: AxisCount<T>[] = [...counts.entries()]
    .map(([value, count]) => ({ value, count, share: total > 0 ? count / total : 0 }))
    // Highest count first; stable secondary sort by pool order for determinism.
    .sort((a, b) => b.count - a.count || pool.indexOf(a.value) - pool.indexOf(b.value));

  return { axis, counts: ordered, distinct: counts.size };
}

/** Pool values ordered by ascending usage in the window (least-used first). */
function underUsed<T extends string>(dist: AxisDistribution<T>, pool: readonly T[], take: number): T[] {
  const used = new Map(dist.counts.map((c) => [c.value, c.count]));
  return [...pool]
    .sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0) || pool.indexOf(a) - pool.indexOf(b))
    .slice(0, take);
}

/**
 * Domination flag for a multi-value axis. Binary axes (pool ≤ 2) are never
 * flagged: a >40% share is structurally guaranteed and would be noise.
 */
function dominationFlag<T extends string>(
  dist: AxisDistribution<T>,
  pool: readonly T[],
  threshold: number,
): AuditFlag | null {
  if (pool.length <= 2) return null;
  const top = dist.counts[0];
  if (!top || top.share <= threshold) return null;
  return {
    axis: dist.axis,
    kind: "domination",
    value: top.value,
    share: top.share,
    threshold,
    message:
      `${dist.axis}: "${top.value}" is ${pct(top.share)} of the window ` +
      `(cap ${pct(threshold)}).`,
  };
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildChannelAudit(input: AuditInput): ChannelAuditReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const windowLimit = input.window ?? ROLLING_WINDOW;
  const all = input.entries;
  const window = all.slice(-windowLimit);
  const windowSize = window.length;
  const windowFull = windowSize >= ROLLING_WINDOW;

  const arc = distributionFor("arc", window.map((e) => e.assignment.arc), ARC_AXES);
  const opener = distributionFor("opener", window.map((e) => e.assignment.opener), OPENER_AXES);
  const pacing = distributionFor("pacing", window.map((e) => e.assignment.pacing), PACING_AXES);
  const voice = distributionFor("voice", window.map((e) => e.assignment.voice), VOICE_POOL);
  const skin = distributionFor("skin", window.map((e) => e.assignment.skin), SKIN_AXES);

  // ── Flags ──────────────────────────────────────────────────────────────
  const flags: AuditFlag[] = [];
  for (const [dist, pool] of [
    [arc, ARC_AXES],
    [opener, OPENER_AXES],
    [voice, VOICE_POOL],
    [skin, SKIN_AXES],
  ] as const) {
    const f = dominationFlag(dist as AxisDistribution<string>, pool, MAX_SAME_ARC_RATIO);
    if (f) flags.push(f);
  }
  // Structure diversity: a full window must carry ≥ MIN_DISTINCT_ARCS arcs.
  if (windowFull && arc.distinct < MIN_DISTINCT_ARCS) {
    flags.push({
      axis: "arc",
      kind: "insufficient-variety",
      threshold: MIN_DISTINCT_ARCS,
      message:
        `arc: only ${arc.distinct} distinct structure(s) in the last ${windowSize} videos ` +
        `(min ${MIN_DISTINCT_ARCS}).`,
    });
  }

  // ── Media ratios (enrichment) ────────────────────────────────────────────
  const hasEnrichment = input.enrichment !== undefined;
  let clipVideos = 0;
  let totalClips = 0;
  let totalStock = 0;
  for (const e of window) {
    const en = input.enrichment?.[e.slug];
    const clips = en?.youtubeClipCount ?? 0;
    const stock = en?.stockImageCount ?? 0;
    if (clips > 0) clipVideos++;
    totalClips += clips;
    totalStock += stock;
  }
  const clipUsageRatio = windowSize > 0 ? clipVideos / windowSize : 0;
  const stockToClipRatio =
    hasEnrichment && totalStock + totalClips > 0 ? totalStock / (totalStock + totalClips) : hasEnrichment ? 1 : null;

  // ── Recommendations ──────────────────────────────────────────────────────
  const recommendations = buildRecommendations(flags, { arc, opener, voice, skin }, windowSize);

  return {
    generatedAt,
    totalVideos: all.length,
    windowSize,
    windowFull,
    arc,
    opener,
    pacing,
    voice,
    skin,
    clipUsageRatio,
    stockToClipRatio,
    flags,
    recommendations,
    verdict: flags.length > 0 ? "needs-attention" : "pass",
  };
}

const POOL_BY_AXIS: Record<string, readonly string[]> = {
  arc: ARC_AXES,
  opener: OPENER_AXES,
  voice: VOICE_POOL,
  skin: SKIN_AXES,
};

function buildRecommendations(
  flags: AuditFlag[],
  dists: {
    arc: AxisDistribution<ArcAxis>;
    opener: AxisDistribution<OpenerAxis>;
    voice: AxisDistribution<VoiceAxis>;
    skin: AxisDistribution<SkinAxis>;
  },
  windowSize: number,
): string[] {
  const recs: string[] = [];
  for (const f of flags) {
    if (f.kind === "domination") {
      const pool = POOL_BY_AXIS[f.axis];
      const dist = (dists as Record<string, AxisDistribution<string>>)[f.axis];
      const alts = pool && dist ? underUsed(dist, pool, 4).filter((v) => v !== f.value) : [];
      recs.push(
        `Rotate ${f.axis}: "${f.value}" is ${pct(f.share ?? 0)} of the last ${windowSize} videos. ` +
          (alts.length > 0 ? `Diversify toward under-used: ${alts.join(", ")}.` : "Diversify the next picks."),
      );
    } else {
      const unseen = ARC_AXES.filter((a) => !dists.arc.counts.some((c) => c.value === a));
      recs.push(
        `Add structure variety: only ${dists.arc.distinct} distinct arc(s) in the last ${windowSize}. ` +
          (unseen.length > 0 ? `Introduce: ${unseen.slice(0, 4).join(", ")}.` : "Introduce an unused arc."),
      );
    }
  }
  return recs;
}

// ── Markdown formatter ───────────────────────────────────────────────────────

function distTable<T extends string>(dist: AxisDistribution<T>): string {
  if (dist.counts.length === 0) return "_no data_\n";
  const rows = dist.counts
    .map((c) => `| ${c.value} | ${c.count} | ${pct(c.share)} |`)
    .join("\n");
  return `| ${dist.axis} | count | share |\n|---|---|---|\n${rows}\n`;
}

export function formatAuditMarkdown(r: ChannelAuditReport): string {
  const lines: string[] = [];
  lines.push("# Channel-Pattern Audit");
  lines.push("");
  lines.push(`_Generated: ${r.generatedAt}_`);
  lines.push("");
  const verdictLabel = r.verdict === "pass" ? "✅ PASS" : "⚠️ NEEDS ATTENTION";
  lines.push(`**Verdict:** ${verdictLabel}`);
  lines.push("");

  if (r.totalVideos === 0) {
    lines.push("No videos recorded in the ledger yet. Nothing to audit.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    `Analyzed the most recent **${r.windowSize}** of **${r.totalVideos}** recorded videos` +
      `${r.windowFull ? " (full rolling window)" : " (partial window)"}.`,
  );
  lines.push("");

  // Flags
  lines.push("## Flags");
  lines.push("");
  if (r.flags.length === 0) {
    lines.push("None — distribution is within quota across all axes.");
  } else {
    for (const f of r.flags) lines.push(`- **${f.axis}** (${f.kind}): ${f.message}`);
  }
  lines.push("");

  // Recommendations
  lines.push("## Recommendations");
  lines.push("");
  if (r.recommendations.length === 0) {
    lines.push("No action needed before upload.");
  } else {
    for (const rec of r.recommendations) lines.push(`- ${rec}`);
  }
  lines.push("");

  // Distributions
  lines.push("## Distributions");
  lines.push("");
  lines.push(distTable(r.arc));
  lines.push(distTable(r.opener));
  lines.push(distTable(r.pacing));
  lines.push(distTable(r.voice));
  lines.push(distTable(r.skin));

  // Media
  lines.push("## Media mix");
  lines.push("");
  lines.push(`- Clip usage: ${pct(r.clipUsageRatio)} of window videos used ≥1 third-party clip.`);
  lines.push(
    `- Stock/custom ratio: ${
      r.stockToClipRatio === null ? "n/a (no media artifacts read)" : `${pct(r.stockToClipRatio)} stock`
    }.`,
  );
  lines.push("");

  return lines.join("\n");
}
