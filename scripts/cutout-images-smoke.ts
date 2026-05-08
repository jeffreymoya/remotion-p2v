import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { processCutoutPlan, resolveImagePlanPath } from "./cutout-images";
import { restoreOriginalsAndCutout } from "./restore-originals-and-cutout";
import type { ImageFetchItem } from "../src/lib/build-image-fetch-prompt";

function item(partial: Partial<ImageFetchItem> & Pick<ImageFetchItem, "label">): ImageFetchItem {
  return {
    image_url: "",
    source_url: "",
    query: `${partial.label} query`,
    visual_requirements: `${partial.label} requirements`,
    rationale: `${partial.label} rationale`,
    ...partial,
  };
}

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-p2v-cutout-"));
const imagesDir = path.join(projectRoot, "public", "images");
const promptsDir = path.join(projectRoot, "prompts");
fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(promptsDir, { recursive: true });

for (const fileName of ["background.jpg", "plane.png", "badge.png", "photo.jpg"]) {
  fs.writeFileSync(path.join(imagesDir, fileName), "fake-image-bytes");
}

const plan: ImageFetchItem[] = [
  item({
    label: "background.jpg",
    asset_role: "background",
    needs_cutout: true,
    preferred_format: "jpg",
    resolved_path: "public/images/background.jpg",
  }),
  item({
    label: "plane.png",
    asset_role: "animated_object",
    needs_cutout: true,
    preferred_format: "png",
    resolved_path: "public/images/plane.png",
  }),
  item({
    label: "badge.png",
    asset_role: "static_overlay",
    needs_cutout: true,
    preferred_format: "png",
  }),
  item({
    label: "legacy.png",
  }),
  item({
    label: "missing.png",
    asset_role: "animated_object",
    needs_cutout: true,
    preferred_format: "png",
  }),
  item({
    label: "photo.jpg",
    asset_role: "static_overlay",
    needs_cutout: true,
    preferred_format: "png",
    resolved_path: "public/images/photo.jpg",
  }),
];

const planPath = path.join(promptsDir, "cutout-images.json");
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), "utf-8");
const promptPath = path.join(promptsDir, "cutout.txt");
const siblingImagePlanPath = path.join(promptsDir, "cutout-images.json");
fs.writeFileSync(promptPath, "Remotion prompt text, not JSON", "utf-8");

const before = fs.readFileSync(planPath, "utf-8");
assert.equal(resolveImagePlanPath(projectRoot, promptPath), siblingImagePlanPath);
const { results } = processCutoutPlan({
  planPath: promptPath,
  projectRoot,
  dryRun: true,
});
const byLabel = new Map(results.map((result) => [result.label, result]));

assert.equal(byLabel.get("background.jpg")?.status, "skipped");
assert.equal(byLabel.get("plane.png")?.status, "would_cutout");
assert.equal(byLabel.get("badge.png")?.status, "would_cutout");
assert.equal(byLabel.get("legacy.png")?.status, "skipped");
assert.equal(byLabel.get("missing.png")?.status, "error");
assert.match(byLabel.get("missing.png")?.error ?? "", /Asset file not found/);
assert.equal(byLabel.get("photo.jpg")?.status, "error");
assert.match(byLabel.get("photo.jpg")?.error ?? "", /must end in \.png/);

assert.equal(
  fs.existsSync(path.join(imagesDir, ".originals")),
  false,
  "dry-run should not create backups",
);
assert.equal(
  fs.readFileSync(planPath, "utf-8"),
  before,
  "dry-run should not rewrite the image plan",
);

fs.mkdirSync(path.join(imagesDir, ".originals"), { recursive: true });
fs.writeFileSync(path.join(imagesDir, ".originals", "plane.png"), "original-plane");
const restoreDryRun = restoreOriginalsAndCutout({
  planPath,
  projectRoot,
  dryRun: true,
  labels: ["plane.png"],
});
assert.equal(restoreDryRun.restored.length, 1);
assert.equal(restoreDryRun.restored[0].status, "would_restore");
assert.equal(restoreDryRun.cutout.results.length, 1);
assert.equal(restoreDryRun.cutout.results[0].status, "would_cutout");
assert.equal(
  fs.readFileSync(path.join(imagesDir, "plane.png"), "utf-8"),
  "fake-image-bytes",
  "restore dry-run should not replace current asset",
);

console.log("Cutout image dry-run smoke passed");
