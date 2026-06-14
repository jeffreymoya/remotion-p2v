/**
 * Usage:
 *   npx tsx tests/docu/docu-ken-burns.test.ts
 */
import * as kenBurnsModule from "../../src/components/docu/DocuKenBurns";

function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) {
    throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`PASS ${label}`);
}

function approx(actual: number, expected: number, epsilon: number, label: string): void {
  assert(
    Math.abs(actual - expected) <= epsilon,
    label,
    `expected ${expected}, got ${actual}`,
  );
}

type KenBurnsTransition = {
  scale: [number, number];
  x: [number, number];
  y: [number, number];
  frames: [number, number];
  easing: string;
};

const getKenBurnsTransition = (kenBurnsModule as {
  getKenBurnsTransition?: (durationInFrames: number, shotIndex: number) => KenBurnsTransition;
}).getKenBurnsTransition;

assert(typeof getKenBurnsTransition === "function", "exports transition helper");

const short = getKenBurnsTransition!(60, 0);
assert(short.frames[0] === 0 && short.frames[1] === 60, "short shot keeps frame bounds");
approx(short.scale[0], 1, 1e-6, "short shot scale starts at 1");
assert(short.scale[1] < 1.03, "short shot zoom stays subtle");
assert(short.x[0] > 0 && short.x[0] < 12, "short shot x drift heavily reduced");
assert(short.y[0] > 0 && short.y[0] < 9, "short shot y drift heavily reduced");

const medium = getKenBurnsTransition!(150, 0);
assert(medium.scale[1] > short.scale[1], "medium shot zoom exceeds short shot");
assert(medium.x[0] > short.x[0], "medium shot x drift exceeds short shot");
assert(medium.y[0] > short.y[0], "medium shot y drift exceeds short shot");

const long = getKenBurnsTransition!(240, 0);
approx(long.scale[1], 1.08, 1e-6, "long shot reaches full zoom");
approx(long.x[0], 40, 1e-6, "long shot reaches full x drift");
approx(long.y[0], 30, 1e-6, "long shot reaches full y drift");

const wrapped = getKenBurnsTransition!(240, 7);
approx(wrapped.x[0], 40, 1e-6, "direction list wraps by shot index");
approx(wrapped.y[0], 30, 1e-6, "direction wrap preserves y drift");

console.log("\nAll docu-ken-burns tests passed.");
