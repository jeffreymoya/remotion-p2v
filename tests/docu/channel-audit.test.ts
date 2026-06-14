/**
 * Unit tests for the channel-pattern audit (Step 3 / YPP Backlog 3).
 *
 * The audit is the READ counterpart to the variety controller (Deliverable A):
 * it reads the variety ledger and flags a rolling batch where any single
 * structure/template dominates, then emits a Markdown report.
 *
 * Usage:
 *   npx tsx tests/docu/channel-audit.test.ts
 */

import {
  buildChannelAudit,
  formatAuditMarkdown,
  type AuditInput,
} from "../../src/lib/docu/channel-audit";
import {
  BASELINE_PRESET,
  presetForArc,
  ROLLING_WINDOW,
  MAX_SAME_ARC_RATIO,
  type ArcAxis,
  type VarietyAssignment,
  type VarietyLedgerEntry,
} from "../../src/lib/docu/variety-controller";

let failures = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

// ── Fixtures ────────────────────────────────────────────────────────────────

function entry(slug: string, assignment: VarietyAssignment): VarietyLedgerEntry {
  return { slug, topic: `Topic ${slug}`, assignment, assignedAt: "2026-06-01T00:00:00.000Z" };
}

/** Build a ledger of `n` entries all using the same arc (forces domination). */
function uniformArc(n: number, arc: ArcAxis): VarietyLedgerEntry[] {
  return Array.from({ length: n }, (_, i) => entry(`v-${i}`, presetForArc(arc)));
}

function input(entries: VarietyLedgerEntry[], extra: Partial<AuditInput> = {}): AuditInput {
  return { entries, generatedAt: "2026-06-01T00:00:00.000Z", ...extra };
}

// ── Empty ledger → pass, no flags ────────────────────────────────────────────

{
  const r = buildChannelAudit(input([]));
  assertEqual(r.totalVideos, 0, "empty: zero videos");
  assertEqual(r.windowSize, 0, "empty: zero window");
  assertEqual(r.flags.length, 0, "empty: no flags");
  assertEqual(r.verdict, "pass", "empty: verdict pass");
  const md = formatAuditMarkdown(r);
  assert(md.includes("# Channel-Pattern Audit"), "empty: markdown has title");
  assert(md.toLowerCase().includes("no videos"), "empty: markdown notes no videos");
}

// ── Uniform arc over a full window → arc-domination flag + insufficient variety

{
  const r = buildChannelAudit(input(uniformArc(ROLLING_WINDOW, "scenario-escalation")));
  assertEqual(r.windowSize, ROLLING_WINDOW, "uniform: full window analyzed");
  assertEqual(r.windowFull, true, "uniform: window marked full");
  assertEqual(r.arc.distinct, 1, "uniform: one distinct arc");
  assertEqual(r.arc.counts[0]?.value, "scenario-escalation", "uniform: top arc value");
  assertEqual(r.arc.counts[0]?.share, 1, "uniform: top arc share 1.0");

  const dom = r.flags.find((f) => f.axis === "arc" && f.kind === "domination");
  assert(!!dom, "uniform: arc-domination flag present");
  assertEqual(dom?.value, "scenario-escalation", "uniform: flag names dominating arc");
  assert((dom?.share ?? 0) > MAX_SAME_ARC_RATIO, "uniform: flag share over threshold");

  const insuff = r.flags.find((f) => f.axis === "arc" && f.kind === "insufficient-variety");
  assert(!!insuff, "uniform: insufficient-variety flag present");

  assertEqual(r.verdict, "needs-attention", "uniform: verdict needs-attention");
  assert(r.recommendations.length > 0, "uniform: recommendations emitted");
  // Recommendation should point at an under-used arc the channel hasn't used.
  assert(
    r.recommendations.some((x) => /countdown|reveal-ladder|case-file-autopsy/.test(x)),
    "uniform: recommendation names an under-used arc",
  );

  const md = formatAuditMarkdown(r);
  assert(md.includes("NEEDS ATTENTION"), "uniform: markdown verdict line");
  assert(md.includes("scenario-escalation"), "uniform: markdown lists dominating arc");
  assert(md.includes("Recommendations"), "uniform: markdown has recommendations section");
}

// ── Well-distributed window → no domination flag, pass ───────────────────────

{
  const arcs: ArcAxis[] = [
    "scenario-escalation",
    "disaster-simulation",
    "case-file-autopsy",
    "countdown",
    "comparison-gauntlet",
    "inside-the-machine",
    "experiment-challenge",
    "reveal-ladder",
    "scenario-escalation",
    "disaster-simulation",
  ];
  const voices = ["en-US-Chirp3-HD-Charon", "en-US-Chirp3-HD-Fenrir", "en-US-Chirp3-HD-Orus"] as const;
  const entries = arcs.map((a, i) =>
    entry(`v-${i}`, { ...presetForArc(a), voice: voices[i % voices.length] }),
  );
  const r = buildChannelAudit(input(entries));
  assert(r.arc.distinct >= 3, "varied: at least three distinct arcs");
  assert(
    !r.flags.some((f) => f.axis === "arc"),
    "varied: no arc flags",
  );
  assertEqual(r.verdict, "pass", "varied: verdict pass");
}

// ── Window slicing: only the most recent ROLLING_WINDOW entries analyzed ──────

{
  // 5 old varied entries + 10 uniform recent → the recent window dominates.
  const old = [
    entry("old-0", presetForArc("countdown")),
    entry("old-1", presetForArc("reveal-ladder")),
    entry("old-2", presetForArc("case-file-autopsy")),
  ];
  const recent = uniformArc(ROLLING_WINDOW, "comparison-gauntlet");
  const r = buildChannelAudit(input([...old, ...recent]));
  assertEqual(r.totalVideos, ROLLING_WINDOW + 3, "slice: total counts all entries");
  assertEqual(r.windowSize, ROLLING_WINDOW, "slice: window capped at ROLLING_WINDOW");
  assertEqual(r.arc.counts[0]?.value, "comparison-gauntlet", "slice: recent arc dominates window");
  assert(
    r.flags.some((f) => f.axis === "arc" && f.kind === "domination"),
    "slice: domination computed on recent window only",
  );
}

// ── Binary pacing axis is reported but never domination-flagged ──────────────

{
  // All measured pacing (baseline) — share 1.0, but pacing has only 2 options
  // so it must not raise a domination flag (would be noise).
  const entries = Array.from({ length: ROLLING_WINDOW }, (_, i) =>
    entry(`v-${i}`, { ...presetForArc(["scenario-escalation", "countdown", "reveal-ladder"][i % 3] as ArcAxis) }),
  );
  const r = buildChannelAudit(input(entries));
  assert(!r.flags.some((f) => f.axis === "pacing"), "pacing: never flagged (binary axis)");
}

// ── Voice domination is flagged (3-value pool) ───────────────────────────────

{
  // Distinct arcs but the same voice everywhere → voice domination.
  const arcs: ArcAxis[] = [
    "scenario-escalation",
    "disaster-simulation",
    "case-file-autopsy",
    "countdown",
    "comparison-gauntlet",
  ];
  const entries = arcs.map((a, i) =>
    entry(`v-${i}`, { ...presetForArc(a), voice: "en-US-Chirp3-HD-Charon" }),
  );
  const r = buildChannelAudit(input(entries));
  const voiceFlag = r.flags.find((f) => f.axis === "voice" && f.kind === "domination");
  assert(!!voiceFlag, "voice: domination flag present when one voice dominates");
  assertEqual(voiceFlag?.value, "en-US-Chirp3-HD-Charon", "voice: flag names dominating voice");
}

// ── Enrichment: clip usage + stock ratio surfaced ────────────────────────────

{
  const entries = [
    entry("a", BASELINE_PRESET),
    entry("b", presetForArc("countdown")),
    entry("c", presetForArc("reveal-ladder")),
    entry("d", presetForArc("case-file-autopsy")),
  ];
  const r = buildChannelAudit(
    input(entries, {
      enrichment: {
        a: { youtubeClipCount: 2, stockImageCount: 50 },
        b: { youtubeClipCount: 0, stockImageCount: 60 },
        // c, d absent → treated as zero clips / zero stock
      },
    }),
  );
  // 1 of 4 videos used clips.
  assertEqual(r.clipUsageRatio, 0.25, "enrichment: clip usage ratio 1/4");
  // stock share = 110 stock / (110 stock + 2 clips)
  assert(r.stockToClipRatio !== null, "enrichment: stock ratio computed");
  assert((r.stockToClipRatio ?? 0) > 0.9, "enrichment: stock-heavy ratio");
  const md = formatAuditMarkdown(r);
  assert(md.includes("Clip usage"), "enrichment: markdown reports clip usage");
}

// ── No enrichment → stockToClipRatio null, clip usage 0 ──────────────────────

{
  const r = buildChannelAudit(input(uniformArc(3, "countdown")));
  assertEqual(r.stockToClipRatio, null, "no-enrichment: stock ratio null");
  assertEqual(r.clipUsageRatio, 0, "no-enrichment: clip usage 0");
}

// ── Summary ──────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll channel-audit tests passed.");
