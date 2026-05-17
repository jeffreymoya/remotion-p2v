import { Client } from "langsmith";

const PROJECT_NAME = process.env.LANGSMITH_PROJECT ?? "remotion-p2v";

interface RunSummary {
  name: string;
  runType: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  metadata: Record<string, unknown>;
  tags: string[];
  extra?: Record<string, unknown>;
}

function parseArgs(): { slug?: string; since?: string } {
  const args = process.argv.slice(2);
  const result: { slug?: string; since?: string } = {};
  for (const arg of args) {
    if (arg.startsWith("--slug=")) result.slug = arg.slice("--slug=".length);
    if (arg.startsWith("--since=")) result.since = arg.slice("--since=".length);
  }
  if (!result.slug && !result.since) {
    console.error("Usage: npx tsx scripts/inspire-analytics.ts --slug <slug> [--since YYYY-MM-DD]");
    process.exit(1);
  }
  return result;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

async function collectRuns(slug: string, since?: Date): Promise<RunSummary[]> {
  const client = new Client();
  const summaries: RunSummary[] = [];

  const filter = `eq(metadata_key, "slug") and eq(metadata_value, "${slug}")`;

  for await (const run of client.listRuns({
    projectName: PROJECT_NAME,
    filter,
    startTime: since,
  })) {
    if (!run.start_time || !run.end_time) continue;
    summaries.push({
      name: run.name,
      runType: run.run_type,
      startTime: new Date(run.start_time),
      endTime: new Date(run.end_time),
      durationMs: new Date(run.end_time).getTime() - new Date(run.start_time).getTime(),
      metadata: (run.extra?.metadata as Record<string, unknown>) ?? {},
      tags: run.tags ?? [],
      extra: run.extra as Record<string, unknown> | undefined,
    });
  }

  return summaries;
}

function extractPhase(run: RunSummary): string | undefined {
  const phaseTag = run.tags.find((t) => t.startsWith("phase:"));
  return phaseTag?.split(":")[1];
}

function extractProvider(run: RunSummary): string | undefined {
  const providerTag = run.tags.find((t) => t.startsWith("provider:"));
  return providerTag?.split(":")[1];
}

function isCacheHit(run: RunSummary): boolean {
  return run.tags.includes("cache_hit:true");
}

interface PhaseStats {
  totalMs: number;
  count: number;
  cacheHits: number;
  cacheMisses: number;
  provider?: string;
}

interface TokenStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

function aggregateByPhase(runs: RunSummary[]): Map<string, PhaseStats> {
  const phases = new Map<string, PhaseStats>();

  for (const run of runs) {
    const phase = extractPhase(run);
    if (!phase) continue;

    const existing = phases.get(phase) ?? {
      totalMs: 0,
      count: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    existing.totalMs += run.durationMs;
    existing.count++;
    if (isCacheHit(run)) existing.cacheHits++;
    else if (run.tags.includes("cache_hit:false")) existing.cacheMisses++;

    const provider = extractProvider(run);
    if (provider) existing.provider = provider;

    phases.set(phase, existing);
  }

  return phases;
}

function aggregateTokens(runs: RunSummary[]): TokenStats {
  const stats: TokenStats = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  for (const run of runs) {
    const usage = run.extra?.usage_metadata as
      | { input_tokens?: number; output_tokens?: number; total_tokens?: number }
      | undefined;
    if (usage) {
      stats.inputTokens += usage.input_tokens ?? 0;
      stats.outputTokens += usage.output_tokens ?? 0;
      stats.totalTokens += usage.total_tokens ?? 0;
    }
  }

  return stats;
}

function aggregateGateBlocks(runs: RunSummary[]): Map<string, { blocked: number; total: number }> {
  const gates = new Map<string, { blocked: number; total: number }>();

  for (const run of runs) {
    if (!run.tags.includes("phase:refine") && !run.tags.includes("phase:gates")) continue;
    const gatePass = run.tags.find((t) => t.startsWith("gate_pass:"));
    if (!gatePass) continue;

    const gateName = run.name;
    const existing = gates.get(gateName) ?? { blocked: 0, total: 0 };
    existing.total++;
    if (gatePass === "gate_pass:false") existing.blocked++;
    gates.set(gateName, existing);
  }

  return gates;
}

function aggregateVideoSources(runs: RunSummary[]): Map<string, number> {
  const sources = new Map<string, number>();

  for (const run of runs) {
    if (!run.tags.includes("phase:videos")) continue;
    const provider = extractProvider(run);
    if (!provider) continue;

    const fallbackTag = run.tags.find((t) => t.startsWith("fallback_used:"));
    const label = fallbackTag ? `${provider} (fallback)` : `${provider} fresh`;
    sources.set(label, (sources.get(label) ?? 0) + 1);
  }

  return sources;
}

async function main(): Promise<void> {
  const { slug, since } = parseArgs();
  const sinceDate = since ? new Date(since) : undefined;

  if (!slug) {
    console.error("--slug is required");
    process.exit(1);
  }

  console.log(`Fetching runs for slug="${slug}" from project="${PROJECT_NAME}"...`);
  const runs = await collectRuns(slug, sinceDate);

  if (runs.length === 0) {
    console.log("No runs found.");
    return;
  }

  // Total wall-clock (root run)
  const rootRuns = runs.filter((r) => r.name === "runLongformPipeline");
  const totalMs = rootRuns.reduce((sum, r) => sum + r.durationMs, 0);

  console.log(`\n═══ Video: ${slug} ═══`);
  console.log(`Total wall-clock:           ${formatDuration(totalMs)}`);

  // Per-phase breakdown
  const phases = aggregateByPhase(runs);
  const phaseOrder = ["research", "narration", "tts", "videos", "artdirect", "refine", "proofread"];

  for (const phase of phaseOrder) {
    const stats = phases.get(phase);
    if (!stats) continue;

    const details: string[] = [];
    if (stats.cacheHits + stats.cacheMisses > 0) {
      details.push(`cache hits: ${stats.cacheHits}/${stats.cacheHits + stats.cacheMisses}`);
    }
    if (stats.provider) details.push(`provider: ${stats.provider}`);

    const suffix = details.length > 0 ? `   (${details.join(", ")})` : "";
    console.log(` ├─ ${phase.padEnd(20)} ${formatDuration(stats.totalMs).padStart(8)}${suffix}`);
  }

  // Token usage
  const tokens = aggregateTokens(runs);
  if (tokens.totalTokens > 0) {
    console.log(
      `\nDeepSeek tokens:    input ${formatNumber(tokens.inputTokens)}  output ${formatNumber(tokens.outputTokens)}  total ${formatNumber(tokens.totalTokens)}`,
    );
  }

  // Gate block rates
  const gateBlocks = aggregateGateBlocks(runs);
  if (gateBlocks.size > 0) {
    console.log("Gate block rates:");
    for (const [gate, stats] of gateBlocks) {
      const pct = stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0;
      console.log(
        `  ${gate.padEnd(20)} ${stats.blocked} / ${stats.total} blocked${pct > 0 ? ` (${pct}%)` : ""}`,
      );
    }
  }

  // Video sources
  const videoSources = aggregateVideoSources(runs);
  if (videoSources.size > 0) {
    const total = [...videoSources.values()].reduce((a, b) => a + b, 0);
    console.log("Video sources:");
    for (const [source, count] of videoSources) {
      const pct = Math.round((count / total) * 100);
      console.log(`  ${source.padEnd(20)} ${count}/${total}   (${pct}%)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
