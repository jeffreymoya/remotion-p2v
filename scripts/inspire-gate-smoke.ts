/**
 * Smoke test: runs all deterministic gates against existing narration artifacts.
 *
 * Usage: tsx scripts/inspire-gate-smoke.ts
 */
import fs from "node:fs";
import path from "node:path";
import { runGates } from "../src/lib/inspire/gates/run-gates";
import type { GateContext } from "../src/lib/inspire/gates/gate-types";

const PROMPTS_DIR = "prompts/inspire";

function findNarrationFiles(): string[] {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  return fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith("-narration.txt"))
    .sort();
}

async function main(): Promise<void> {
  const files = findNarrationFiles();
  if (files.length === 0) {
    console.log("No narration files found in prompts/inspire/");
    process.exit(0);
  }

  console.log(`\n━━ Gate Smoke Test — ${files.length} narration file(s) ━━\n`);

  for (const file of files) {
    const narration = fs.readFileSync(path.join(PROMPTS_DIR, file), "utf-8");
    // Extract chapter index from filename (e.g. resilience-seg-01-narration.txt)
    const match = file.match(/-seg-(\d+)-/);
    const chapterIndex = match ? parseInt(match[1], 10) - 1 : 0;
    const slug = file.replace("-narration.txt", "");

    const ctx: GateContext = {
      topic: slug.replace(/-seg-\d+$/, ""),
      slug,
      chapterIndex,
      chapterCount: files.length,
      chapterRole: chapterIndex === 0 ? "open" : "build",
      priorChapters: [],
    };

    const result = await runGates(narration, ctx);

    console.log(`${result.pass ? "PASS" : "FAIL"} — ${file}`);
    for (const r of result.results) {
      const metrics = r.metrics
        ? ` (${Object.entries(r.metrics).map(([k, v]) => `${k}=${v}`).join(", ")})`
        : "";
      console.log(`  ${r.pass ? "✓" : "✗"} ${r.gate}${metrics}`);
      for (const note of r.notes) {
        console.log(`    [${note.severity}] ${note.message}`);
      }
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
