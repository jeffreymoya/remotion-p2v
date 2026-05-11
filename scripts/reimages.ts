import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const IMAGES_DIR = path.resolve("public", "images");
const PROMPTS_DIR = path.resolve("prompts");

const ACQUISITION_FIELDS = [
  "resolved_path",
  "resolution_error",
  "runware_image_uuid",
  "background_removed",
  "background_removal_model",
  "background_removal_error",
  "cutout_path",
  "cutout_source_path",
  "cutout_success",
  "cutout_error",
] as const;

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function clearImagesDir(): void {
  ensureDir(IMAGES_DIR);

  for (const entry of fs.readdirSync(IMAGES_DIR)) {
    const fullPath = path.join(IMAGES_DIR, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${path.relative(process.cwd(), fullPath)}`);
  }
}

function findImagePlans(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImagePlans(fullPath));
    } else if (entry.isFile() && entry.name.endsWith("-images.json")) {
      results.push(fullPath);
    }
  }

  return results;
}

function clearImagePlanAcquisitionState(planPath: string): boolean {
  const raw = fs.readFileSync(planPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return false;

  let changed = false;
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    for (const field of ACQUISITION_FIELDS) {
      if (field in record) {
        delete record[field];
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(planPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
    console.log(`Cleared acquisition metadata in ${path.relative(process.cwd(), planPath)}`);
  }

  return changed;
}

function clearImagePlans(): void {
  const plans = findImagePlans(PROMPTS_DIR);
  let changed = 0;

  for (const planPath of plans) {
    try {
      if (clearImagePlanAcquisitionState(planPath)) changed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not reset ${path.relative(process.cwd(), planPath)}: ${message}`);
    }
  }

  console.log(`Reset ${changed}/${plans.length} image plan(s)`);
}

function runImagesScript(args: string[]): void {
  const commandArgs = ["run", "images"];
  if (args.length > 0) {
    commandArgs.push("--", ...args);
  }

  const result = spawnSync("npm", commandArgs, { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

function main(): void {
  clearImagesDir();
  clearImagePlans();
  runImagesScript(process.argv.slice(2));
}

main();
