// Code generator for docu-scripts.ts.
//
// Two-phase: writes per-topic JSON under prompts/docu/<slug>.json,
// then globs all topic JSONs and emits a clean TypeScript index at
// src/generated/docu-scripts.ts.

import fs from "node:fs";
import path from "node:path";
import type { DocuScript } from "../../components/docu/DocumentaryComposition";

const SCRIPTS_PATH = "src/generated/docu-scripts.ts";
const TOPICS_DIR = "prompts/docu";

function isTopicJson(filename: string): boolean {
  if (!filename.endsWith(".json")) return false;
  if (filename.endsWith("-timings.json")) return false;
  if (filename.endsWith("-images.json")) return false;
  if (filename.endsWith("-topic.json")) return false;
  if (filename.endsWith("-plan.json")) return false;
  if (/-seg-\d+-(narration|overlays)\.json$/.test(filename)) return false;
  return true;
}

function isValidDocuScript(obj: unknown): obj is DocuScript {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  return typeof s.slug === "string"
    && typeof s.topic === "string"
    && typeof s.fps === "number"
    && typeof s.width === "number"
    && typeof s.height === "number"
    && typeof s.durationInFrames === "number"
    && Array.isArray(s.wordTimings)
    && Array.isArray(s.sentences)
    && Array.isArray(s.clips);
}

export function generateDocuScriptsFile(script: DocuScript): void {
  // Phase 1: write this topic's data as pure JSON
  const jsonPath = path.join(TOPICS_DIR, `${script.slug}.json`);
  fs.mkdirSync(TOPICS_DIR, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(script, null, 2));

  // Phase 2: glob all topic JSONs, merge, write clean index
  const allTopicPaths = fs
    .readdirSync(TOPICS_DIR)
    .filter(isTopicJson)
    .map((name) => path.join(TOPICS_DIR, name))
    .sort();

  const allScripts: DocuScript[] = [];
  for (const p of allTopicPaths) {
    try {
      const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (isValidDocuScript(raw)) {
        allScripts.push(raw);
      } else {
        console.warn(`[docu:codegen] ⚠ Skipping ${p} — not a valid DocuScript structure`);
      }
    } catch {
      console.warn(`[docu:codegen] ⚠ Skipping ${p} — JSON parse error`);
    }
  }

  const fileContent = `\
import type { DocuScript } from "../components/docu/DocumentaryComposition";

// AUTO-GENERATED — do not edit manually. Run: npm run docu <topic>
// Discovers all topics from prompts/docu/*.json automatically.
export const docuScripts: DocuScript[] = ${JSON.stringify(allScripts, null, 2)};
`;
  fs.mkdirSync(path.dirname(SCRIPTS_PATH), { recursive: true });
  fs.writeFileSync(SCRIPTS_PATH, fileContent);
  console.log(`[docu:codegen] ${allScripts.length} topic(s) → src/generated/docu-scripts.ts`);
}
