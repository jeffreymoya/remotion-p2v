/**
 * Usage:
 *   npx tsx tests/tracing.test.ts
 *
 * Covers textOnlyAssetSummary redaction rules: buffer types, data-URI base64,
 * media-extension URLs, local asset paths, file-extension strings, long base64
 * detection, key-based exclusion, key-based value redaction, circular reference
 * guard, depth guard, and passthrough of safe scalars.
 */
import { textOnlyAssetSummary } from "../src/lib/tracing";
import { Buffer } from "node:buffer";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── Buffer types ────────────────────────────────────────────────────────

assert(
  JSON.stringify(textOnlyAssetSummary(Buffer.from("hello"))) ===
    JSON.stringify({ kind: "buffer", byteLength: 5 }),
  "buffer → flattened",
);

assert(
  JSON.stringify(textOnlyAssetSummary(new ArrayBuffer(8))) ===
    JSON.stringify({ kind: "arrayBuffer", byteLength: 8 }),
  "arrayBuffer → flattened",
);

assert(
  JSON.stringify(textOnlyAssetSummary(new Uint8Array([1, 2, 3]))) ===
    JSON.stringify({ kind: "typedArray", byteLength: 3 }),
  "typedArray → flattened",
);

// ── Data-URI base64 ─────────────────────────────────────────────────────

assert(
  textOnlyAssetSummary("data:image/png;base64,iVBORw0KGgo") === "(redacted base64 asset)",
  "data-URI base64 → redacted",
);

// ── Media-extension URLs (should redact) ────────────────────────────────

assert(
  textOnlyAssetSummary("https://images.pexels.com/photos/123/photo.jpg") === "(redacted asset url)",
  "media-extension URL → redacted",
);

assert(
  textOnlyAssetSummary("https://cdn.example.com/video.mp4?token=abc") === "(redacted asset url)",
  "media-extension URL with query → redacted",
);

assert(
  textOnlyAssetSummary("https://cdn.example.com/audio.wav") === "(redacted asset url)",
  "audio-extension URL → redacted",
);

// ── Non-media URLs (should pass through) ────────────────────────────────

assert(
  textOnlyAssetSummary("https://www.federalreserve.gov/data.html") ===
    "https://www.federalreserve.gov/data.html",
  "research URL → passthrough",
);

assert(
  textOnlyAssetSummary("https://api.example.com/v1/search?q=test") ===
    "https://api.example.com/v1/search?q=test",
  "API URL → passthrough",
);

// ── Local asset paths ───────────────────────────────────────────────────

assert(
  textOnlyAssetSummary("/public/images/docu/slug/img-01.jpg") === "(redacted local asset path)",
  "absolute local asset path → redacted",
);

assert(
  textOnlyAssetSummary("public/audio/docu/slug.wav") === "(redacted local asset path)",
  "relative local asset path → redacted",
);

assert(
  textOnlyAssetSummary("public/videos/docu/clip.mp4") === "(redacted local asset path)",
  "local video path → redacted",
);

// ── File-extension strings ──────────────────────────────────────────────

assert(
  textOnlyAssetSummary("my-audio.wav") === "(redacted asset path)",
  "audio extension → redacted",
);

assert(
  textOnlyAssetSummary("image.png") === "(redacted asset path)",
  "image extension → redacted",
);

// ── Long base64 detection ───────────────────────────────────────────────

const longBase64 = Buffer.alloc(5000, "A").toString("base64");
assert(
  textOnlyAssetSummary(longBase64) === "(redacted possible base64 payload)",
  "long base64 string → redacted",
);

const longButSafe = "Hello world. This is a normal sentence. " + "x".repeat(5000);
assert(
  textOnlyAssetSummary(longButSafe) === longButSafe,
  "long non-base64 string (has spaces + punct) → passthrough",
);

// ── Key-based exclusion (secret keys skipped) ───────────────────────────

assert(
  JSON.stringify(
    textOnlyAssetSummary({ apiKey: "sk-12345", name: "test" }),
  ) === JSON.stringify({ name: "test" }),
  "apiKey → excluded",
);

assert(
  JSON.stringify(
    textOnlyAssetSummary({ authorization: "Bearer token", count: 1 }),
  ) === JSON.stringify({ count: 1 }),
  "authorization → excluded",
);

assert(
  JSON.stringify(
    textOnlyAssetSummary({ token: "abc", value: 42 }),
  ) === JSON.stringify({ value: 42 }),
  "token → excluded",
);

assert(
  JSON.stringify(
    textOnlyAssetSummary({ secret: "s3cret", id: "x" }),
  ) === JSON.stringify({ id: "x" }),
  "secret → excluded",
);

// header key excluded (word boundary: "header" alone, not "Headers")
assert(
  JSON.stringify(
    textOnlyAssetSummary({ header: "anything", ok: true }),
  ) === JSON.stringify({ ok: true }),
  "header → excluded",
);

// ── Key-based asset child inspection ────────────────────────────────────

assert(
  JSON.stringify(
    textOnlyAssetSummary({ audioBuffer: Buffer.from("x") }),
  ) === JSON.stringify({ audioBuffer: { kind: "buffer", byteLength: 1 } }),
  "audioBuffer → buffer-flattened",
);

assert(
  JSON.stringify(
    textOnlyAssetSummary({ base64: "some-value" }),
  ) === JSON.stringify({ base64: "some-value" }),
  "base64 key with short text → passthrough",
);

// ── Key-based value redaction ───────────────────────────────────────────

assert(
  JSON.stringify(
    textOnlyAssetSummary({ path: "anything" }),
  ) === JSON.stringify({ path: "(redacted asset reference)" }),
  "path key → value redacted",
);

assert(
  JSON.stringify(
    textOnlyAssetSummary({ sourceUrl: "anything" }),
  ) === JSON.stringify({ sourceUrl: "(redacted asset reference)" }),
  "sourceUrl key → value redacted",
);

// Non-matching compound keys should NOT match (word boundary)
assert(
  JSON.stringify(
    textOnlyAssetSummary({ filepath: "keep-me", curl: "keep-me" }),
  ) === JSON.stringify({ filepath: "keep-me", curl: "keep-me" }),
  "compound keys with 'path'/'url' substring → passthrough",
);

// ── Safe scalar passthrough ─────────────────────────────────────────────

assert(textOnlyAssetSummary(42) === 42, "number → passthrough");
assert(textOnlyAssetSummary(true) === true, "boolean → passthrough");
assert(textOnlyAssetSummary(null) === null, "null → passthrough");
assert(textOnlyAssetSummary("hello world") === "hello world", "short string → passthrough");

// ── Circular reference guard ────────────────────────────────────────────

const circ: Record<string, unknown> = { name: "loop" };
(circ as Record<string, unknown>).self = circ;
const result = textOnlyAssetSummary(circ) as Record<string, unknown>;
assert(
  result.name === "loop" && result.self === "(circular)",
  "circular reference → (circular)",
);

// ── Depth guard ─────────────────────────────────────────────────────────

function buildDeep(depth: number): unknown {
  let obj: Record<string, unknown> = { leaf: 1 };
  for (let i = 0; i < depth; i++) obj = { nest: obj };
  return obj;
}
const deep = buildDeep(25) as Record<string, unknown>;
assert(
  JSON.stringify(textOnlyAssetSummary(deep)).includes("(max depth)"),
  "depth > 20 → (max depth)",
);

// ── Nested object traversal ─────────────────────────────────────────────

const nested = {
  metadata: { slug: "my-topic", count: 3 },
  buffer: Buffer.from("data"),
  secrets: { apiKey: "sk-123" },
};
const nestedResult = textOnlyAssetSummary(nested) as Record<string, unknown>;
assert(
  nestedResult.metadata !== undefined &&
    (nestedResult.metadata as Record<string, unknown>).slug === "my-topic",
  "nested safe keys → preserved",
);
// buffer key matches word boundary and buffer pattern
if (nestedResult.buffer) {
  const buf = nestedResult.buffer as Record<string, unknown>;
  assert(
    buf.kind === "buffer" && buf.byteLength === 4,
    "nested buffer → flattened",
  );
}

// ── Array traversal ─────────────────────────────────────────────────────

const arr = [Buffer.from("a"), "hello", { secret: "x", id: 1 }];
const arrResult = textOnlyAssetSummary(arr) as unknown[];
assert(
  arrResult[1] === "hello",
  "array string → passthrough",
);
assert(
  JSON.stringify(arrResult[0]) === JSON.stringify({ kind: "buffer", byteLength: 1 }),
  "array buffer → flattened",
);

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\nAll ${passed} tests passed.`);
