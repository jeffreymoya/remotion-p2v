import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { downloadOne } from "../src/lib/download-images";
import type { ImageFetchItem } from "../src/lib/build-image-fetch-prompt";

function hasImageMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) ||
    buffer.subarray(0, 4).equals(Buffer.from("GIF8"))
  );
}

const outputDir = path.join(os.tmpdir(), "remotion-p2v-image-smoke");
const baseItem = {
  query: "beach umbrella transparent png",
  visual_requirements:
    "Isolated beach umbrella on transparent or clean background.",
  rationale: "Smoke test for live image search resolution.",
};

const cases: ImageFetchItem[] = [
  {
    ...baseItem,
    label: "search-only.png",
    image_url: "",
    source_url: "",
  },
  {
    ...baseItem,
    label: "blocked-pixabay-hint.png",
    image_url:
      "https://cdn.pixabay.com/photo/2013/07/12/19/18/beach-154452_1280.png",
    source_url: "https://pixabay.com/vectors/beach-umbrella-sun-sand-summer-154452/",
  },
  {
    ...baseItem,
    label: "html-hint.png",
    image_url: "https://example.com/",
    source_url: "https://example.com/",
  },
];

const blockedHostFragments = [
  "alamy.com",
  "dreamstime.com",
  "freepik.com",
  "istockphoto.com",
  "pngtree.com",
  "shutterstock.com",
  "vecteezy.com",
  "123rf.com",
];

async function main(): Promise<void> {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  for (const item of cases) {
    const result = await downloadOne(item, outputDir);
    assert.equal(result.ok, true, `${item.label}: ${result.error ?? "failed"}`);
    assert.ok(result.url, `${item.label}: missing resolved image URL`);
    assert.equal(
      blockedHostFragments.some((host) => result.url?.includes(host)),
      false,
      `${item.label}: resolved blocked stock host ${result.url}`,
    );
    assert.equal(
      blockedHostFragments.some((host) => result.sourceUrl?.includes(host)),
      false,
      `${item.label}: resolved blocked stock source ${result.sourceUrl}`,
    );
    assert.ok(fs.existsSync(result.path), `${item.label}: output file missing`);

    const buffer = fs.readFileSync(result.path);
    assert.equal(
      hasImageMagicBytes(buffer),
      true,
      `${item.label}: saved file is not recognized image bytes`,
    );
  }

  console.log(`Image resolver smoke passed: ${cases.length} cases`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
