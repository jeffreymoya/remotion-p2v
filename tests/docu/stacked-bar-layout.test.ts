/**
 * Usage:
 *   npx tsx tests/docu/stacked-bar-layout.test.ts
 */
import { buildStackedBarSegments } from "../../src/components/docu/StackedBarChart";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.0001;
}

const series = [
  { name: "Subscriptions", points: [{ x: "Q1", y: 4.2 }, { x: "Q2", y: 5.8 }, { x: "Q3", y: 7.5 }, { x: "Q4", y: 9.6 }] },
  { name: "Services", points: [{ x: "Q1", y: 1.8 }, { x: "Q2", y: 2.1 }, { x: "Q3", y: 2.4 }, { x: "Q4", y: 2.6 }] },
  { name: "Marketplace", points: [{ x: "Q1", y: 0.4 }, { x: "Q2", y: 0.6 }, { x: "Q3", y: 1.1 }, { x: "Q4", y: 1.8 }] },
];

const baseY = 730;
const plotH = 640;
const globalMax = 14;
const q1Segments = buildStackedBarSegments({
  series,
  categoryIndex: 0,
  baseY,
  plotH,
  globalMax,
});

assert(q1Segments.length === 3, "returns one segment per series");
assert(q1Segments[0].seriesIndex === 2, "bottom segment is the last series");
assert(q1Segments[2].seriesIndex === 0, "top segment is the first series");

for (let i = 0; i < q1Segments.length - 1; i++) {
  assert(
    nearlyEqual(q1Segments[i].topY, q1Segments[i + 1].bottomY),
    `segment ${i} touches segment ${i + 1}`,
    `topY=${q1Segments[i].topY}, nextBottomY=${q1Segments[i + 1].bottomY}`,
  );
}

const totalHeight = q1Segments.reduce((sum, seg) => sum + seg.height, 0);
assert(
  nearlyEqual(q1Segments[q1Segments.length - 1].topY, baseY - totalHeight),
  "top segment begins at the total stack height",
);
