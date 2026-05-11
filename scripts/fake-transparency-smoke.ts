import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validateDownloadedAsset } from "../src/lib/download-images";
import type { LegacyImageItem } from "../src/lib/download-images";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-transparency-"));
const imagePath = path.join(tmpDir, "fake-transparent.png");

const python = fs.existsSync(path.join(process.cwd(), ".venv", "bin", "python"))
  ? path.join(process.cwd(), ".venv", "bin", "python")
  : "python3";
const generated = spawnSync(
  python,
  [
    "-c",
    `
from PIL import Image
import sys

path = sys.argv[1]
size = 128
tile = 16
image = Image.new("RGBA", (size, size), (255, 255, 255, 255))
pixels = image.load()
for y in range(size):
    for x in range(size):
        value = 238 if ((x // tile) + (y // tile)) % 2 == 0 else 204
        pixels[x, y] = (value, value, value, 255)
image.save(path)
`,
    imagePath,
  ],
  { encoding: "utf-8" },
);
assert.equal(generated.status, 0, generated.stderr);

async function main(): Promise<void> {
  const item: LegacyImageItem = {
    label: "splash.png",
    needs_background_removal: true,
    preferred_format: "png",
    query: "water splash transparent png",
    visual_requirements: "Transparent PNG splash with no background.",
    rationale: "Used as an overlay.",
  };

  const error = validateDownloadedAsset(item, imagePath);
  assert.match(error ?? "", /checkerboard transparency preview/);

  console.log("Fake transparency rejection smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
