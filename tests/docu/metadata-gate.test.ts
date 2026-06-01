/**
 * Unit tests for the metadata review gate (Step 3 / report P1 §8).
 *
 * Usage:
 *   npx tsx tests/docu/metadata-gate.test.ts
 */

import {
  runMetadataGate,
  type MetadataGateContext,
  type VideoMetadata,
} from "../../src/lib/docu/metadata-gate";

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

function has(r: { findings: { check: string }[] }, check: string): boolean {
  return r.findings.some((f) => f.check === check);
}

const NARRATION = [
  "The Federal Reserve sets the interest rate that ripples through every mortgage and credit card.",
  "In 2024 the rate hit 5.5 percent, the highest level in two decades.",
  "When the Fed raises rates, borrowing costs climb and your monthly payment can jump by hundreds of dollars.",
  "The central bank prints money to fund deficits, and that quietly erodes the value of your savings.",
];

const BASE_CTX: MetadataGateContext = { narration: NARRATION, hasSources: true };

// ── Clean metadata passes ─────────────────────────────────────────────────────

{
  const meta: VideoMetadata = {
    title: "How the Fed Controls Your Money and Your Mortgage Rate",
    description: "A clear look at how interest rate decisions affect your monthly payment and savings.",
    tags: ["federal reserve", "interest rate", "mortgage", "savings", "money"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assertEqual(r.clean, true, "clean: no findings");
  assertEqual(r.blocked, false, "clean: not blocked");
  assertEqual(r.findings.length, 0, "clean: zero findings");
}

// ── Sensational claim term, with sources → warn (not block) ───────────────────

{
  const meta: VideoMetadata = {
    title: "LEAKED: The Confirmed Truth About the Fed",
    tags: ["fed"],
  };
  const r = runMetadataGate(meta, { ...BASE_CTX, hasSources: true });
  assert(has(r, "sensational-claim"), "sensational+sources: flagged");
  const f = r.findings.find((x) => x.check === "sensational-claim")!;
  assertEqual(f.severity, "warn", "sensational+sources: warn severity");
}

// ── Sensational claim term, no sources → block ────────────────────────────────

{
  const meta: VideoMetadata = { title: "LEAKED: The Confirmed Truth About the Fed", tags: ["fed"] };
  const r = runMetadataGate(meta, { ...BASE_CTX, hasSources: false });
  assert(has(r, "sensational-claim"), "sensational+nosources: flagged");
  const f = r.findings.find((x) => x.check === "sensational-claim")!;
  assertEqual(f.severity, "block", "sensational+nosources: block severity");
  assertEqual(r.blocked, true, "sensational+nosources: blocked");
}

// ── Title number not in narration → block ─────────────────────────────────────

{
  const meta: VideoMetadata = {
    title: "The Fed Just Hid 9 Trillion Dollars From You",
    tags: ["fed", "money"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "title-number-unsupported"), "title-number: flagged (9 not in narration)");
  assertEqual(r.blocked, true, "title-number: blocked");
}

// ── Title number present in narration → no number finding ─────────────────────

{
  const meta: VideoMetadata = {
    title: "Why the 5.5 Percent Rate Changes Everything",
    tags: ["rate", "fed"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assertEqual(has(r, "title-number-unsupported"), false, "title-number: 5.5 supported, no finding");
}

// ── Year-like number unsupported → warn, not block ────────────────────────────

{
  const meta: VideoMetadata = {
    title: "The 2019 Decision That Still Drains Your Wallet",
    tags: ["fed"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  const f = r.findings.find((x) => x.check === "title-number-unsupported");
  assert(f !== undefined, "year-number: flagged");
  assertEqual(f?.severity, "warn", "year-number: warn severity, not block");
}

// ── Title with no narration support → weak-support warn ────────────────────────

{
  const meta: VideoMetadata = {
    title: "Crypto Bitcoin Ethereum Doge Altcoin Pump Explained",
    tags: ["crypto"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "title-weak-support"), "weak-support: flagged for off-topic title");
}

// ── Description overstating certainty → warn ──────────────────────────────────

{
  const meta: VideoMetadata = {
    title: "How the Fed Controls Your Money",
    description: "This guaranteed strategy is risk-free and you will never lose money.",
    tags: ["fed", "money", "rate"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "description-overstates-certainty"), "certainty: flagged");
  const f = r.findings.find((x) => x.check === "description-overstates-certainty")!;
  assertEqual(f.severity, "warn", "certainty: warn severity");
}

// ── Keyword stuffing: too many tags → warn ────────────────────────────────────

{
  const tags = Array.from({ length: 35 }, (_, i) => `fed money rate tag${i}`);
  const meta: VideoMetadata = { title: "How the Fed Controls Your Money", tags };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "tag-stuffing"), "tag-stuffing: flagged for >30 tags");
}

// ── Off-topic high-RPM bait tags → warn ───────────────────────────────────────

{
  const meta: VideoMetadata = {
    title: "How the Fed Controls Your Money",
    tags: ["federal reserve", "interest rate", "weight loss", "celebrity gossip"],
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "tag-off-topic"), "tag-off-topic: flagged for unrelated tags");
  const f = r.findings.find((x) => x.check === "tag-off-topic")!;
  assert(f.message.includes("weight loss") || f.message.includes("celebrity gossip"), "tag-off-topic: names offending tag");
}

// ── Thumbnail implying fake footage → flagged ─────────────────────────────────

{
  const meta: VideoMetadata = {
    title: "How the Fed Controls Your Money",
    tags: ["fed", "money", "rate"],
    thumbnailText: "EXCLUSIVE FOOTAGE: Powell CAUGHT ON CAMERA",
  };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "thumbnail-fake"), "thumbnail-fake: flagged for fake-footage implication");
  assertEqual(r.blocked, true, "thumbnail-fake: blocked");
}

// ── Empty title is reported, not crashed ──────────────────────────────────────

{
  const meta: VideoMetadata = { title: "   ", tags: ["fed"] };
  const r = runMetadataGate(meta, BASE_CTX);
  assert(has(r, "title-missing"), "empty-title: flagged");
  assertEqual(r.blocked, true, "empty-title: blocked");
}

// ── Summary ───────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll metadata-gate tests passed");
