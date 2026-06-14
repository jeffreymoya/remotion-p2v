/**
 * Overlay animation preset registry — correctness + round-trip tests.
 *
 * Usage:
 *   npx tsx tests/docu/overlay-animations.test.ts
 */
import {
  ENTER_PRESET_KEYS,
  EXIT_PRESET_KEYS,
  PRESET_REGISTRY,
  getEnterPreset,
  fadeUp,
  fadeIn,
  popIn,
  slideUp,
  wipe,
  countUpValue,
  typewriterChars,
} from "../../src/lib/docu/overlays/overlay-animations";
import type { StyleTransitionFn } from "../../src/lib/docu/overlays/overlay-animations";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── Registry completeness ───────────────────────────────────────────────

const registryKeys = Object.keys(PRESET_REGISTRY);
assert(registryKeys.length >= 10, "registry has >= 10 presets", `got ${registryKeys.length}`);

assert(registryKeys.includes("fadeUp"), "registry includes fadeUp");
assert(registryKeys.includes("fadeIn"), "registry includes fadeIn");
assert(registryKeys.includes("popIn"), "registry includes popIn");
assert(registryKeys.includes("slideUp"), "registry includes slideUp");
assert(registryKeys.includes("wipe"), "registry includes wipe");
assert(registryKeys.includes("growX"), "registry includes growX");
assert(registryKeys.includes("growY"), "registry includes growY");
assert(registryKeys.includes("countUp"), "registry includes countUp");
assert(registryKeys.includes("typewriter"), "registry includes typewriter");
assert(registryKeys.includes("none"), "registry includes none");

// ── ENTER_PRESET_KEYS match registry ────────────────────────────────────

for (const key of ENTER_PRESET_KEYS) {
  assert(PRESET_REGISTRY[key] !== undefined, `ENTER ${key} has registry entry`);
}

for (const key of EXIT_PRESET_KEYS) {
  assert(PRESET_REGISTRY[key] !== undefined, `EXIT ${key} has registry entry`);
}

// ── getEnterPreset throws on unknown key ────────────────────────────────

let threw = false;
try { getEnterPreset("garbage-preset"); } catch { threw = true; }
assert(threw, "getEnterPreset throws on unknown key");

// ── fadeUp output shape at representative frames ─────────────────────────

const f0 = fadeUp(0, 0, 0, 10);
assert(typeof f0.opacity === "number", "fadeUp start: has opacity");
assert((f0.opacity as number) <= 0.01, "fadeUp start: opacity near 0", `got ${f0.opacity}`);
assert(typeof f0.transform === "string", "fadeUp start: has transform");

const fMid = fadeUp(5, 0, 0, 10);
assert((fMid.opacity as number) > 0.7, "fadeUp mid: opacity > 0.7 (ease curve is fast-out)", `got ${fMid.opacity}`);

const fEnd = fadeUp(10, 0, 0, 10);
assert((fEnd.opacity as number) >= 0.99, "fadeUp end: opacity near 1", `got ${fEnd.opacity}`);

// ── fadeIn output ────────────────────────────────────────────────────────

const fi0 = fadeIn(0, 0, 0, 8);
assert((fi0.opacity as number) <= 0.01, "fadeIn start: opacity near 0");
const fiEnd = fadeIn(8, 0, 0, 8);
assert((fiEnd.opacity as number) >= 0.99, "fadeIn end: opacity near 1");

// ── popIn output shape ───────────────────────────────────────────────────

const pi = popIn(5, 0, 0, 10, 100, 200);
assert(typeof pi.transform === "string", "popIn: has transform");
assert(pi.transform!.includes("scale"), "popIn: transform includes scale");
assert((pi.transformOrigin as string).includes("100px 200px"), "popIn: origin set", `got ${pi.transformOrigin}`);

// ── slideUp with custom translateY ───────────────────────────────────────

const su = slideUp(5, 0, 0, 10, 24);
assert(typeof su.transform === "string", "slideUp: has transform");
// slideUp translates from 24 → 0, so at frame 5 it should be at ~12px
assert(su.transform!.includes("translateY"), "slideUp: transform includes translateY");

// ── wipe output ──────────────────────────────────────────────────────────

const w = wipe(5, 0, 0, 10, 1920);
assert(typeof w.clipPath === "string", "wipe: has clipPath");
assert(w.clipPath!.includes("inset"), "wipe: clipPath uses inset");

// ── countUp monotonic ────────────────────────────────────────────────────

let prev = countUpValue(0, 0, 0, 10, 100);
for (let f = 1; f <= 10; f++) {
  const cur = countUpValue(f, 0, 0, 10, 100);
  assert(cur >= prev, `countUp monotonic at frame ${f}`, `prev=${prev} cur=${cur}`);
  prev = cur;
}
const cuEnd = countUpValue(10, 0, 0, 10, 100);
assert(cuEnd >= 99.9, "countUp reaches target", `got ${cuEnd}`);

// ── typewriter integer output ────────────────────────────────────────────

const tw = typewriterChars(5, 0, 0, 10, 100);
assert(Number.isInteger(tw), "typewriter returns integer");
assert(tw >= 0 && tw <= 100, "typewriter in [0, target]");

// ── none preset is identity ──────────────────────────────────────────────

const none = PRESET_REGISTRY.none!;
assert(none.channel === "style", "none is style channel");
const noneStyle = (none.fn as StyleTransitionFn)(5, 0, 0, 10);
assert(Object.keys(noneStyle).length === 0, "none returns empty object", `got ${JSON.stringify(noneStyle)}`);

// ── Channel correctness ──────────────────────────────────────────────────

assert(PRESET_REGISTRY.fadeUp!.channel === "style", "fadeUp is style channel");
assert(PRESET_REGISTRY.fadeIn!.channel === "style", "fadeIn is style channel");
assert(PRESET_REGISTRY.popIn!.channel === "style", "popIn is style channel");
assert(PRESET_REGISTRY.slideUp!.channel === "style", "slideUp is style channel");
assert(PRESET_REGISTRY.wipe!.channel === "style", "wipe is style channel");
assert(PRESET_REGISTRY.growX!.channel === "style", "growX is style channel");
assert(PRESET_REGISTRY.growY!.channel === "style", "growY is style channel");
assert(PRESET_REGISTRY.countUp!.channel === "value", "countUp is value channel");
assert(PRESET_REGISTRY.typewriter!.channel === "value", "typewriter is value channel");

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${passed} tests passed`);
if (passed < 30) throw new Error(`${passed} tests passed — expected 30+`);
