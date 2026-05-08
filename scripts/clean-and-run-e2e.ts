import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseScript } from "../src/lib/parse-script";

const SCRIPT_PATH = "script.txt";
const PROMPTS_DIR = "prompts";
const IMAGES_DIR = "public/images";
const TMP_DIR = ".tmp";
const OUT_DIR = "out";
const COMPOSITIONS_DIR = "src/compositions";
const GENERATED_DIR = "src/generated";
const BARREL_PATH = path.join(COMPOSITIONS_DIR, "index.ts");
const SCENE_SCRIPTS_PATH = path.join(GENERATED_DIR, "scene-scripts.ts");

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function parseArgs(): { segmentIndex: number; cliArgs: string[] } {
  const args = process.argv.slice(2);
  let segmentIndex = 0;
  const cliArgs: string[] = [];

  for (const arg of args) {
    if (/^\d+$/.test(arg)) {
      segmentIndex = Number(arg);
      continue;
    }

    cliArgs.push(arg);
  }

  return { segmentIndex, cliArgs };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function removeFileIfExists(filePath: string): void {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    fs.rmSync(filePath);
    console.log(`Removed ${filePath}`);
  }
}

function removeFilesInDir(dir: string): void {
  ensureDir(dir);

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isFile()) {
      fs.rmSync(fullPath);
      console.log(`Removed ${fullPath}`);
    }
  }
}

function removeDirContents(dir: string): void {
  ensureDir(dir);

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${fullPath}`);
  }
}

function resetCompositions(): void {
  ensureDir(COMPOSITIONS_DIR);

  for (const entry of fs.readdirSync(COMPOSITIONS_DIR)) {
    if (entry === "index.ts") continue;

    const fullPath = path.join(COMPOSITIONS_DIR, entry);
    if (fs.statSync(fullPath).isFile() && entry.endsWith(".tsx")) {
      fs.rmSync(fullPath);
      console.log(`Removed ${fullPath}`);
    }
  }

  const emptyBarrel = `export const compositions = {};\n\nexport default compositions;\n`;
  fs.writeFileSync(BARREL_PATH, emptyBarrel);
  console.log(`Reset ${BARREL_PATH}`);
}

function getSegmentSlug(segmentIndex: number): string {
  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error(`Script file not found: ${SCRIPT_PATH}`);
    process.exit(1);
  }

  const segments = parseScript(fs.readFileSync(SCRIPT_PATH, "utf-8"));
  if (segments.length === 0) {
    console.error("No segments found in script.txt");
    process.exit(1);
  }

  if (segmentIndex >= segments.length) {
    console.error(
      `Segment index ${segmentIndex} out of range (0-${segments.length - 1})`,
    );
    process.exit(1);
  }

  return toSlug(segments[segmentIndex].title);
}

function cleanArtifacts(segmentIndex: number): void {
  const slug = getSegmentSlug(segmentIndex);

  ensureDir(PROMPTS_DIR);
  // Legacy single-composition files
  removeFileIfExists(path.join(PROMPTS_DIR, `${slug}.txt`));
  removeFileIfExists(path.join(PROMPTS_DIR, `${slug}-images.json`));
  removeFileIfExists(path.join(PROMPTS_DIR, `${slug}-narrative.txt`));
  removeFileIfExists(path.join(PROMPTS_DIR, `${slug}-scene.json`));

  // Scene manifest
  removeFileIfExists(path.join(PROMPTS_DIR, `${slug}-scenes.json`));

  // Scene output subdirectory (scene-###-*.txt, scene-###-*-images.json, scene-###-*-scene.json)
  const sceneOutDir = path.join(PROMPTS_DIR, slug);
  if (fs.existsSync(sceneOutDir)) {
    fs.rmSync(sceneOutDir, { recursive: true, force: true });
    console.log(`Removed ${sceneOutDir}`);
  }

  // Images (flat and nested scene dirs)
  if (fs.existsSync(IMAGES_DIR)) {
    for (const entry of fs.readdirSync(IMAGES_DIR)) {
      const fullPath = path.join(IMAGES_DIR, entry);
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Removed ${fullPath}`);
    }
  }

  removeDirContents(TMP_DIR);
  removeFilesInDir(OUT_DIR);
  resetCompositions();

  // Reset generated scene-scripts module
  ensureDir(GENERATED_DIR);
  const emptySceneScripts = [
    'import { SceneScriptSchema } from "../lib/scene-script-schema";',
    'import type { SceneScript } from "../lib/scene-script-schema";',
    "",
    "const rawSceneScripts = [] as const;",
    "",
    "export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>",
    "  SceneScriptSchema.parse(script),",
    ");",
    "",
  ].join("\n");
  fs.writeFileSync(SCENE_SCRIPTS_PATH, emptySceneScripts);
  console.log(`Reset ${SCENE_SCRIPTS_PATH}`);
}

function runCli(segmentIndex: number, cliArgs: string[]): void {
  const result = spawnSync(
    "npm",
    ["run", "dev", "--", String(segmentIndex), ...cliArgs],
    { stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

const { segmentIndex, cliArgs } = parseArgs();
cleanArtifacts(segmentIndex);
runCli(segmentIndex, cliArgs);
