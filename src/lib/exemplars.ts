import fs from "node:fs";
import path from "node:path";
import { EXEMPLAR_COUNT } from "./config";

const EXEMPLARS_DIR = "examples/prompts";

export function loadExemplars(): string[] {
  if (!fs.existsSync(EXEMPLARS_DIR)) {
    console.error(`Exemplars directory not found: ${EXEMPLARS_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(EXEMPLARS_DIR)
    .filter((f) => f.endsWith(".txt"))
    .sort()
    .slice(0, EXEMPLAR_COUNT);
  if (files.length === 0) {
    console.error(`No exemplar files found in ${EXEMPLARS_DIR}`);
    process.exit(1);
  }
  return files.map((f) =>
    fs.readFileSync(path.join(EXEMPLARS_DIR, f), "utf-8").trim(),
  );
}
