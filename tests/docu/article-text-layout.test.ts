/**
 * Smoke test: layoutHeadline text layout.
 *
 * Usage:
 *   npx tsx tests/docu/article-text-layout.test.ts
 */

import { createCanvas } from "canvas";

// Polyfill document.createElement for Node.js so canvas.measureText works
(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === "canvas") return createCanvas(1, 1);
    throw new Error(`Mock createElement: ${tag}`);
  },
};

import { layoutHeadline, HEADLINE_LAYOUT_OPTS } from "../../src/lib/docu/article-text-layout.ts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    if (detail) console.error(`    ${detail}`);
    failed++;
  }
}

function eq<T>(actual: T, expected: T, label: string): void {
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

function main() {
  console.log("\n══ Article Text Layout Smoke Test ══\n");

  // ── Single-line headline ──
  console.log("── Single-line headline ──\n");
  const single = layoutHeadline("Federal Reserve holds rates steady", HEADLINE_LAYOUT_OPTS);
  assert(single.length > 0, "returns non-empty array");
  assert(
    single.length === 5,
    `5 words detected (got ${single.length})`,
  );
  for (const b of single) {
    assert(b.width > 0, `"${b.word}" has positive width`);
    assert(b.height > 0, `"${b.word}" has positive height`);
    assert(b.left >= 0, `"${b.word}" has non-negative left`);
    assert(b.top >= 0, `"${b.word}" has non-negative top`);
    assert(
      b.left + b.width <= HEADLINE_LAYOUT_OPTS.containerWidth + 1,
      `"${b.word}" fits within container width`,
    );
  }

  // Reading order: left should increase within a single line
  let inOrder = true;
  for (let i = 1; i < single.length; i++) {
    if (single[i].left <= single[i - 1].left) {
      inOrder = false;
      break;
    }
  }
  assert(inOrder, "bboxes arrive in left-to-right reading order");

  // ── Multi-line headline ──
  console.log("\n── Multi-line headline ──\n");
  const multi = layoutHeadline(
    "Partial government shutdown begins as funding lapses despite Senate deal",
    HEADLINE_LAYOUT_OPTS,
  );
  assert(multi.length === 10, `10 words detected (got ${multi.length})`);

  // Check for at least 2 distinct Y positions (multi-line)
  const tops = new Set(multi.map((b) => Math.round(b.top)));
  assert(
    tops.size >= 2 || multi.length <= 6,
    `headline wraps to multiple lines (${tops.size} distinct top values)`,
  );

  // Reading order: top then left across lines (with ±2px top tolerance)
  inOrder = true;
  for (let i = 1; i < multi.length; i++) {
    const prev = multi[i - 1];
    const cur = multi[i];
    if (Math.abs(cur.top - prev.top) < 4) {
      // Same line: left must increase
      if (cur.left < prev.left) {
        inOrder = false;
        break;
      }
    } else if (cur.top < prev.top) {
      inOrder = false;
      break;
    }
  }
  assert(inOrder, "multi-line bboxes arrive in reading order (top-band then left)");

  for (const b of multi) {
    assert(b.width > 0, `"${b.word}" has positive width`);
    assert(b.height > 0, `"${b.word}" has positive height`);
  }

  // ── Empty string ──
  console.log("\n── Empty string ──\n");
  const empty = layoutHeadline("", HEADLINE_LAYOUT_OPTS);
  eq(empty.length, 0, "empty headline returns empty array");

  // ── Whitespace-only headline ──
  console.log("\n── Whitespace-only ──\n");
  const whitespace = layoutHeadline("   \t  ", HEADLINE_LAYOUT_OPTS);
  eq(whitespace.length, 0, "whitespace-only headline returns empty array");

  // ── All bboxes within container bounds ──
  console.log("\n── Container bounds ──\n");
  const allBboxes = [...single, ...multi];
  const allInBounds = allBboxes.every(
    (b) => b.left + b.width <= HEADLINE_LAYOUT_OPTS.containerWidth + 1,
  );
  assert(allInBounds, "all bboxes fit within container width");

  console.log(`\n══ Results: ${passed} passed, ${failed} failed ══\n`);
  if (failed > 0) process.exit(1);
}

main();
