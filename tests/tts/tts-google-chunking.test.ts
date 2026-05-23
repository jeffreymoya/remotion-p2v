/**
 * Unit tests for TTS text chunking (Google 5000-byte limit).
 *
 * Usage: tsx tests/tts/tts-google-chunking.test.ts
 */
import {
  _splitTextIntoTtsChunks as splitTextIntoTtsChunks,
  _INTER_CHUNK_SILENCE_SECONDS,
} from "../../src/lib/tts-google";
import { injectPausesForGoogle } from "../../src/lib/shared/tts-pause-injector";

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

function deepEq<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

const BYTES_PER_SAMPLE = 2;
const GOOGLE_TTS_SAMPLE_RATE = 24000;

function main(): void {
  console.log("\n── TTS Chunking Tests ──\n");

  // ── Short text (< 4800 bytes) ─────────────────────────────────────────
  console.log("Short text (< 4800 bytes):");
  {
    const chunks = splitTextIntoTtsChunks("A single paragraph.");
    eq(chunks.length, 1, "1 paragraph → 1 chunk");
    eq(chunks[0], "A single paragraph.", "chunk unchanged");
  }

  // ── Two paragraphs that fit together ───────────────────────────────────
  console.log("\nTwo paragraphs that fit together:");
  {
    const p1 = "Short first paragraph.";
    const p2 = "Short second paragraph.";
    const text = `${p1}\n\n${p2}`;
    const chunks = splitTextIntoTtsChunks(text);
    eq(chunks.length, 1, "2 short paras → 1 chunk");
    eq(chunks[0], text, "chunk preserves paragraph breaks");
  }

  // ── Two paragraphs that don't fit ──────────────────────────────────────
  console.log("\nTwo paragraphs that don't fit:");
  {
    const long = "A".repeat(2900);
    const text = `${long}\n\n${long}`;
    const chunks = splitTextIntoTtsChunks(text);
    eq(chunks.length, 2, "2 long paras → 2 chunks");

    let allWithinLimit = true;
    for (const c of chunks) {
      const injected = injectPausesForGoogle(c);
      if (Buffer.byteLength(injected, "utf8") > 4800) {
        allWithinLimit = false;
        console.error(`    chunk with ${Buffer.byteLength(injected, "utf8")} bytes exceeds limit`);
      }
    }
    assert(allWithinLimit, "every chunk ≤ 4800 injected bytes");
  }

  // ── Single paragraph > limit (sentence-level fallback) ────────────────
  console.log("\nSingle paragraph > limit (sentence fallback):");
  {
    const sentence = "A".repeat(2700) + "!";
    const para = `${sentence} Another sentence here.`;
    const chunks = splitTextIntoTtsChunks(para);
    assert(chunks.length >= 1, "produces at least 1 chunk");

    let allWithinLimit = true;
    for (const c of chunks) {
      const injected = injectPausesForGoogle(c);
      if (Buffer.byteLength(injected, "utf8") > 4800) {
        allWithinLimit = false;
      }
    }
    assert(allWithinLimit, "sentence-level chunks ≤ 4800 injected bytes");
  }

  // ── Empty string ───────────────────────────────────────────────────────
  console.log("\nEmpty string:");
  {
    const chunks = splitTextIntoTtsChunks("");
    eq(chunks.length, 0, '"" → 0 chunks');
  }

  // ── Injection inflates size ────────────────────────────────────────────
  console.log("\nInjection inflates size (dashes push pairs over limit):");
  {
    // Two paragraphs each ~2360 chars with 10 em-dashes.
    // Raw joined bytes: ~4782 (under 4800).
    // After injection (+11 for \n\n → ... ... ..., +4 per dash): ~4873 (over 4800).
    // The function must split based on injected byte count, not raw.
    const dashes = " —".repeat(10); // 10 em-dashes = 30 raw bytes + spaces
    const base = "A".repeat(2350);
    const para = `${base}${dashes}.`;
    const text = `${para}\n\n${para}`;

    const rawBytes = Buffer.byteLength(text, "utf8");
    assert(rawBytes < 4801, `raw bytes ${rawBytes} < 4800`);

    const injectedBytes = Buffer.byteLength(injectPausesForGoogle(text), "utf8");
    assert(injectedBytes > 4800, `injected bytes ${injectedBytes} > 4800`);

    const chunks = splitTextIntoTtsChunks(text);
    eq(chunks.length, 2, "splits 2 paras when injected bytes exceed limit");

    let allWithinLimit = true;
    for (const c of chunks) {
      if (Buffer.byteLength(injectPausesForGoogle(c), "utf8") > 4800) {
        allWithinLimit = false;
        console.error(`    chunk with ${Buffer.byteLength(injectPausesForGoogle(c), "utf8")} injected bytes exceeds limit`);
      }
    }
    assert(allWithinLimit, "every chunk ≤ 4800 injected bytes");
  }

  // ── Whitespace-only string ────────────────────────────────────────────
  console.log("\nWhitespace-only string:");
  {
    const chunks = splitTextIntoTtsChunks("   \n\n   ");
    eq(chunks.length, 0, "whitespace-only → 0 chunks");
  }

  // ── INTER_CHUNK_SILENCE_SECONDS constant ───────────────────────────────
  console.log("\nSilence pad constant:");
  {
    eq(_INTER_CHUNK_SILENCE_SECONDS, 1.5, "INTER_CHUNK_SILENCE_SECONDS = 1.5");

    const silenceBytes =
      Math.round(_INTER_CHUNK_SILENCE_SECONDS * GOOGLE_TTS_SAMPLE_RATE) *
      BYTES_PER_SAMPLE;
    eq(silenceBytes, 72000, "1.5s @ 24kHz mono → 72000 silence bytes");
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) process.exit(1);
}

main();
