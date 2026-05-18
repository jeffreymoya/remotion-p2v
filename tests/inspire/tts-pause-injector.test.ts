/**
 * Unit tests for TTS pause injection (Google Chirp 3 HD).
 *
 * Usage: tsx tests/inspire/tts-pause-injector.test.ts
 */
import { injectPausesForGoogle } from "../../src/lib/inspire/tts-pause-injector";

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

function eq(actual: string, expected: string, label: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function main(): void {
  console.log("\n━━ TTS Pause Injector Tests ━━\n");

  // ── Paragraph breaks ──────────────────────────────────────────────────
  console.log("Paragraph breaks (\\n\\n → long pause):");
  eq(
    injectPausesForGoogle("First.\n\nSecond."),
    "First. ... ... ... Second.",
    "double newline → ... ... ...",
  );
  eq(
    injectPausesForGoogle("First.\n\n\nSecond."),
    "First. ... ... ... Second.",
    "triple newline → ... ... ... (same as double)",
  );

  // ── Single newlines ───────────────────────────────────────────────────
  console.log("\nSingle newlines (\\n → space):");
  eq(
    injectPausesForGoogle("Line one.\nLine two."),
    "Line one. Line two.",
    "single newline → space",
  );

  // ── Standalone ellipsis ───────────────────────────────────────────────
  console.log("\nStandalone ellipsis (... → ... ...):");
  eq(
    injectPausesForGoogle("And then... it happened."),
    "And then... ... it happened.",
    "standalone ... → ... ...",
  );

  // ── Em-dash ───────────────────────────────────────────────────────────
  console.log("\nEm-dash (— → — ...):");
  eq(
    injectPausesForGoogle("Stop — and listen."),
    "Stop — ... and listen.",
    "em-dash → — ...",
  );

  // ── Multi-ellipsis preservation ───────────────────────────────────────
  console.log("\nMulti-ellipsis preservation:");
  eq(
    injectPausesForGoogle("Wait... ... for it."),
    "Wait... ... for it.",
    "existing ... ... is preserved",
  );
  eq(
    injectPausesForGoogle("Wait... ... ... for it."),
    "Wait... ... ... for it.",
    "existing ... ... ... is preserved",
  );

  // ── Paragraph break chains stay stable ────────────────────────────────
  console.log("\nParagraph-break chains stay stable:");
  eq(
    injectPausesForGoogle("A.\n\nB.\n\nC."),
    "A. ... ... ... B. ... ... ... C.",
    "two paragraph breaks stay as ... ... ... each",
  );

  // ── Combined scenario ─────────────────────────────────────────────────
  console.log("\nCombined scenario:");
  eq(
    injectPausesForGoogle("Start.\n\nMiddle... pause.\nEnd — done."),
    "Start. ... ... ... Middle... ... pause. End — ... done.",
    "paragraph + standalone ... + newline + em-dash",
  );

  // ── No mutations (pure function) ──────────────────────────────────────
  console.log("\nPurity:");
  const input = "Hello.\n\nWorld.";
  injectPausesForGoogle(input);
  eq(input, "Hello.\n\nWorld.", "original string is not mutated");

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n━━ Results: ${passed} passed, ${failed} failed ━━\n`);
  if (failed > 0) process.exit(1);
}

main();
