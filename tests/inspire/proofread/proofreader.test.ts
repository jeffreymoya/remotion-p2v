/**
 * Cross-chapter proofreader tests — runs the citation-fidelity (deterministic)
 * gate and verifies it catches known errors in the fixture chapters.
 *
 * Usage: tsx tests/inspire/proofread/proofreader.test.ts
 */
import fs from "node:fs";
import path from "node:path";
import { runCitationFidelityGate } from "../../../src/lib/inspire/proofread/citation-fidelity-gate";
import { stringSimilarity } from "../../../src/lib/inspire/proofread/string-similarity";
import type { ResearchBundle } from "../../../src/lib/inspire/research/research-schema";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), "utf-8");
}

const chapter1 = loadFixture("chapter-1.txt");
const chapter2 = loadFixture("chapter-2.txt");
const chapter3 = loadFixture("chapter-3.txt");
const research: ResearchBundle = JSON.parse(
  loadFixture("research-bundle.json"),
);

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

async function main(): Promise<void> {
  console.log("\n━━ Proofreader Tests ━━\n");

  // ── String similarity utility ─────────────────────────────────────────
  console.log("String similarity:");
  assert(stringSimilarity("hello", "hello") === 1, "identical strings → 1");
  assert(stringSimilarity("hello", "helo") >= 0.8, "close strings → >= 0.8");
  assert(stringSimilarity("hello", "world") < 0.5, "different strings → < 0.5");
  assert(stringSimilarity("", "") === 1, "empty strings → 1 (identity)");
  assert(stringSimilarity("abc", "") === 0, "one empty → 0");

  // ── Citation-fidelity gate ────────────────────────────────────────────
  console.log("\nCitation-fidelity gate:");
  const chapters = [chapter1, chapter2, chapter3];
  const results = runCitationFidelityGate(chapters, research);

  assert(results.length === 3, `returns per-chapter results (got ${results.length})`);

  // Chapter 1 should detect year drift (says 2018, anchor says 2004)
  const ch1Notes = results[0].notes;
  assert(!results[0].pass, "chapter 1 FAILS citation-fidelity");
  assert(
    ch1Notes.some((n) => n.message.includes("year drift")),
    `chapter 1 has year drift note (got ${ch1Notes.length} notes: ${ch1Notes.map(n => n.message).join("; ")})`,
  );

  // Chapter 2 should pass — quotes and attributions match anchors
  assert(results[1].pass, `chapter 2 PASSES citation-fidelity (notes: ${results[1].notes.map(n => n.message).join("; ")})`);

  // Chapter 3 should detect attribution drift (quotes Frankl as 1959 when anchor says 1946)
  const ch3Notes = results[2].notes;
  assert(!results[2].pass, "chapter 3 FAILS citation-fidelity");
  assert(
    ch3Notes.some((n) => n.message.includes("year drift") || n.message.includes("unverified")),
    `chapter 3 flags year drift or unverified content`,
  );

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n━━ Results: ${passed} passed, ${failed} failed ━━\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
