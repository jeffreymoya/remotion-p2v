/**
 * Unit tests for the description source exporter (Step 3 / YPP Backlog 4).
 *
 * Usage:
 *   npx tsx tests/docu/description-export.test.ts
 */

import {
  buildDescriptionGroups,
  buildDescriptionSources,
  formatDescriptionText,
  DEFAULT_MAX_RESEARCH_LINKS,
  type DescriptionInput,
} from "../../src/lib/docu/description-export";

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

function fullInput(overrides: Partial<DescriptionInput> = {}): DescriptionInput {
  return {
    sources: [
      { url: "https://a.example/1", title: "Fed Rate Decision" },
      { url: "https://a.example/2", title: "CPI Report" },
    ],
    thirdPartyFootage: [
      { sourceUrl: "https://www.youtube.com/watch?v=abc", channel: "Fed Press", title: "FOMC Statement" },
    ],
    stockAssets: { provider: "pexels", count: 12 },
    music: { path: "background-music/ambient-tension.mp3" },
    voice: { name: "en-US-Chirp3-HD-Charon" },
    ...overrides,
  };
}

// ── Happy path: all groups present ────────────────────────────────────────

{
  const { groups, text } = buildDescriptionSources(fullInput());
  assertEqual(groups.research.length, 2, "happy: two research sources");
  assertEqual(groups.researchOverflow, 0, "happy: no overflow");
  assertEqual(groups.footage.length, 1, "happy: one clip");
  assertEqual(groups.stock?.count, 12, "happy: stock count");
  assertEqual(groups.music?.name, "ambient-tension.mp3", "happy: music basename");
  assertEqual(groups.voice?.name, "en-US-Chirp3-HD-Charon", "happy: voice");

  assert(text.startsWith("SOURCES & ATTRIBUTION"), "happy: header present");
  assert(text.includes("• Fed Rate Decision — https://a.example/1"), "happy: research line w/ title");
  assert(text.includes('• Fed Press — "FOMC Statement" (https://www.youtube.com/watch?v=abc)'), "happy: clip line");
  assert(text.includes("• 12 stock images via Pexels — https://www.pexels.com"), "happy: stock summary + link");
  assert(text.includes("• ambient-tension.mp3"), "happy: music line");
  assert(text.includes("Narration: synthesized voice (en-US-Chirp3-HD-Charon)."), "happy: narration line");
}

// ── Research de-dup + cap with overflow note ──────────────────────────────

{
  const many = Array.from({ length: DEFAULT_MAX_RESEARCH_LINKS + 3 }, (_, i) => ({
    url: `https://s.example/${i}`,
    title: `Source ${i}`,
  }));
  // add a duplicate URL that must collapse (not count toward overflow twice)
  many.push({ url: "https://s.example/0", title: "Dup" });

  const { groups, text } = buildDescriptionSources(fullInput({ sources: many }));
  assertEqual(groups.research.length, DEFAULT_MAX_RESEARCH_LINKS, "cap: research capped");
  assertEqual(groups.researchOverflow, 3, "cap: overflow excludes the duplicate");
  assert(text.includes("…and 3 more sources cited in the video."), "cap: overflow note plural");
}

{
  const overflowOne = Array.from({ length: DEFAULT_MAX_RESEARCH_LINKS + 1 }, (_, i) => ({
    url: `https://s.example/${i}`,
  }));
  const { text } = buildDescriptionSources(fullInput({ sources: overflowOne }));
  assert(text.includes("…and 1 more source cited in the video."), "cap: overflow note singular");
}

// ── Title-less research falls back to bare URL ────────────────────────────

{
  const { text } = buildDescriptionSources(
    fullInput({ sources: [{ url: "https://x.example/raw" }] }),
  );
  assert(text.includes("• https://x.example/raw"), "no-title: bare url line");
  assert(!text.includes("—  https"), "no-title: no dangling dash");
}

// ── Empty groups are omitted, not rendered as "none" ──────────────────────

{
  const { groups, text } = buildDescriptionSources({
    sources: [{ url: "https://only.example/1", title: "Only" }],
    thirdPartyFootage: [],
    stockAssets: { provider: "pexels", count: 0 },
    music: null,
    voice: null,
  });
  assertEqual(groups.footage.length, 0, "omit: no footage");
  assertEqual(groups.stock, null, "omit: zero-count stock dropped");
  assert(text.includes("Research & data:"), "omit: research present");
  assert(!text.includes("Footage"), "omit: no footage header");
  assert(!text.includes("Stock media:"), "omit: no stock header");
  assert(!text.includes("Music:"), "omit: no music header");
  assert(!text.includes("Narration:"), "omit: no narration line");
}

// ── No sources at all → single explanatory line, never a stray header ─────

{
  const { text } = buildDescriptionSources({
    sources: [],
    thirdPartyFootage: [],
  });
  assert(text.includes("No external sources to attribute"), "empty: explanatory fallback");
  assert(!text.includes("Research & data:"), "empty: no research header");
}

// ── Clip de-dup by source URL + title-less clip ───────────────────────────

{
  const { groups, text } = buildDescriptionSources(
    fullInput({
      thirdPartyFootage: [
        { sourceUrl: "https://yt.example/v", channel: "Ch A", title: "Talk" },
        { sourceUrl: "https://yt.example/v", channel: "Ch A", title: "Talk" },
        { sourceUrl: "https://yt.example/w", channel: "Ch B", title: "" },
      ],
    }),
  );
  assertEqual(groups.footage.length, 2, "clip-dedup: duplicate url collapsed");
  assert(text.includes("• Ch B (https://yt.example/w)"), "clip-dedup: title-less clip line");
}

// ── Stock singular noun ───────────────────────────────────────────────────

{
  const { text } = buildDescriptionSources(fullInput({ stockAssets: { provider: "pexels", count: 1 } }));
  assert(text.includes("• 1 stock image via Pexels"), "stock: singular noun");
}

// ── Music path with directories + query string → clean basename ───────────

{
  const groups = buildDescriptionGroups(fullInput({ music: { path: "public/audio/m/track.wav?v=2" } }));
  assertEqual(groups.music?.name, "track.wav", "music: basename strips dirs + query");
}

// ── formatDescriptionText is deterministic for identical groups ───────────

{
  const inp = fullInput();
  const a = formatDescriptionText(buildDescriptionGroups(inp));
  const b = formatDescriptionText(buildDescriptionGroups(inp));
  assertEqual(a, b, "determinism: identical output");
}

// ── Summary ────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll description-export tests passed.");
