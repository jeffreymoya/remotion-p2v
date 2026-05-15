import fs from "node:fs";
import path from "node:path";
import { InspirationScriptSchema } from "./inspire-schema";
import type { InspirationScript } from "./inspire-schema";
import { writeFileAtomically } from "../scene-manifest";

const INSPIRE_JSON_DIR = "prompts/inspire";
const INSPIRE_MODULE_PATH = "src/generated/inspire-scripts.ts";

function escapeNonAscii(value: string): string {
  return value.replace(/[\u007f-\uffff]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function toTsLiteral(value: unknown): string {
  return escapeNonAscii(JSON.stringify(value, null, 2));
}

function readInspireScripts(): InspirationScript[] {
  if (!fs.existsSync(INSPIRE_JSON_DIR)) return [];

  const scripts: InspirationScript[] = [];
  const entries = fs.readdirSync(INSPIRE_JSON_DIR);

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    // Segment JSONs ({slug}-seg-01.json) are pipeline intermediates — exclude from registry.
    if (/-seg-\d+\.json$/.test(entry)) continue;
    const filePath = path.join(INSPIRE_JSON_DIR, entry);
    const raw = fs.readFileSync(filePath, "utf-8");
    try {
      scripts.push(InspirationScriptSchema.parse(JSON.parse(raw)));
    } catch {
      // Skip corrupted or unparseable files
    }
  }

  return scripts.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function writeInspireScriptsModule(): void {
  const scripts = readInspireScripts();
  const contents = `import type { InspirationScript } from "../lib/inspire/inspire-schema";

export const inspireScripts: InspirationScript[] = ${toTsLiteral(scripts)};
`;
  fs.mkdirSync(path.dirname(INSPIRE_MODULE_PATH), { recursive: true });
  writeFileAtomically(INSPIRE_MODULE_PATH, contents);
}

export function writeInspireJson(
  script: InspirationScript,
): { path: string; script: InspirationScript } {
  const validated = InspirationScriptSchema.parse(script);

  fs.mkdirSync(INSPIRE_JSON_DIR, { recursive: true });
  const jsonPath = path.join(INSPIRE_JSON_DIR, `${validated.slug}.json`);
  writeFileAtomically(jsonPath, JSON.stringify(validated, null, 2));

  writeInspireScriptsModule();

  return { path: jsonPath, script: validated };
}
