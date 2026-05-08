import fs from "node:fs";
import path from "node:path";
import { SceneScriptSchema } from "../src/lib/scene-script-schema";

const PROMPTS_DIR = path.resolve("prompts");
const OUT_PATH = path.resolve("src/generated/scene-scripts.ts");

function loadSceneFiles(): unknown[] {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  const files = fs.readdirSync(PROMPTS_DIR).filter((f) => f.endsWith("-scene.json"));
  return files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PROMPTS_DIR, f), "utf-8"));
      } catch (err) {
        console.error(`Could not parse ${f}:`, err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    })
    .filter(Boolean);
}

function validateAll(scripts: unknown[]) {
  for (const s of scripts) {
    const res = SceneScriptSchema.safeParse(s);
    if (!res.success) {
      console.error("Scene validation failed:", JSON.stringify(res.error.issues, null, 2));
      process.exit(2);
    }
  }
}

function writeModule(scripts: unknown[]) {
  const content = `import { SceneScriptSchema } from "../lib/scene-script-schema";
import type { SceneScript } from "../lib/scene-script-schema";

const rawSceneScripts = ${JSON.stringify(scripts, null, 2)} as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
`;
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, content, "utf-8");
  console.log(`Wrote ${OUT_PATH} (${scripts.length} scripts)`);
}

function main() {
  const scripts = loadSceneFiles();
  if (scripts.length === 0) {
    console.warn("No scene JSON files found in prompts/ — nothing to write.");
    process.exit(0);
  }
  validateAll(scripts);
  writeModule(scripts);
}

main();
