#!/usr/bin/env tsx
// scripts/docu-channel-audit.ts — channel-pattern variety audit (YPP Backlog 3).
//
// Reads the channel-level variety ledger plus per-slug media artifacts, runs the
// pure channel audit over the most recent rolling window, prints a summary, and
// writes a Markdown report to `prompts/docu/_channel-audit.md`. Advisory by
// default; pass `--strict` to exit non-zero when a batch needs attention (CI).
//
// Usage:
//   npx tsx scripts/docu-channel-audit.ts [--window N] [--strict]

import fs from "node:fs";

import {
  buildChannelAudit,
  formatAuditMarkdown,
  type AuditEnrichment,
} from "../src/lib/docu/channel-audit";
import { readCachedJson } from "../src/lib/docu/pipeline";
import { loadLedger } from "../src/lib/docu/variety-controller";

const PROMPTS_DIR = "prompts/docu";
const REPORT_PATH = `${PROMPTS_DIR}/_channel-audit.md`;

function parseArgs(argv: string[]): { window?: number; strict: boolean } {
  let window: number | undefined;
  let strict = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") strict = true;
    else if (a === "--window") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) {
        console.error(`Invalid --window value: ${argv[i]}`);
        process.exit(1);
      }
      window = n;
    }
  }
  return { window, strict };
}

/** Read per-slug media signals the ledger does not carry. Tolerates absence. */
function readEnrichment(slug: string): AuditEnrichment {
  const clips = readCachedJson<{ records?: unknown[] }>(`${PROMPTS_DIR}/${slug}-clips.json`);
  const images = readCachedJson<{ slots?: unknown[] }>(`${PROMPTS_DIR}/${slug}-images.json`);
  return {
    youtubeClipCount: clips?.records?.length ?? 0,
    stockImageCount: images?.slots?.length ?? 0,
  };
}

function main(): void {
  const { window, strict } = parseArgs(process.argv.slice(2));
  const ledger = loadLedger();

  const enrichment: Record<string, AuditEnrichment> = {};
  for (const entry of ledger.entries) {
    enrichment[entry.slug] = readEnrichment(entry.slug);
  }

  const report = buildChannelAudit({ entries: ledger.entries, enrichment, window });
  const markdown = formatAuditMarkdown(report);
  fs.writeFileSync(REPORT_PATH, markdown);

  const verdictLabel = report.verdict === "pass" ? "PASS" : "NEEDS ATTENTION";
  console.log(
    `[docu] channel-audit: ${verdictLabel} — ` +
      `analyzed ${report.windowSize}/${report.totalVideos} videos, ${report.flags.length} flag(s).`,
  );
  for (const f of report.flags) console.log(`  ⚠ ${f.axis} (${f.kind}): ${f.message}`);
  console.log(`[docu] report written: ${REPORT_PATH}`);

  if (strict && report.verdict === "needs-attention") process.exit(2);
}

main();
