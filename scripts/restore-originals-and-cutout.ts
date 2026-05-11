import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseImageFetchResponse,
  type ImageFetchItem,
} from "../src/lib/build-image-fetch-prompt";
import {
  isCutoutCandidate,
  processCutoutPlan,
  resolveImagePlanPath,
  type CutoutPlanOptions,
} from "./cutout-images";

interface RestoreResult {
  label: string;
  status: "restored" | "would_restore" | "error";
  assetPath: string;
  sourcePath: string;
  error?: string;
}

interface RestoreAndCutoutOptions extends CutoutPlanOptions {
  labels: string[];
  requireLabel?: boolean;
}

function safeLabel(label: string): string {
  return path.basename(label);
}

function toAbsolutePath(projectRoot: string, filePath: string): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(projectRoot, filePath);
}

function toStoredPath(projectRoot: string, filePath: string): string {
  const relative = path.relative(projectRoot, filePath);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative;
  }
  return filePath;
}

function matchesLabels(item: ImageFetchItem, labels: Set<string>): boolean {
  return labels.size === 0 || labels.has(item.label) || labels.has(safeLabel(item.label));
}

function resolveAssetPath(
  item: ImageFetchItem,
  projectRoot: string,
  publicImagesDir: string,
): string {
  if (item.resolved_path) {
    return toAbsolutePath(projectRoot, item.resolved_path);
  }
  return path.join(publicImagesDir, safeLabel(item.label));
}

function resolveOriginalPath(
  item: ImageFetchItem,
  projectRoot: string,
  publicImagesDir: string,
): string {
  if (item.cutout_source_path) {
    const storedSourcePath = toAbsolutePath(projectRoot, item.cutout_source_path);
    if (fs.existsSync(storedSourcePath)) {
      return storedSourcePath;
    }
  }
  return path.join(publicImagesDir, ".originals", safeLabel(item.label));
}

function restoreOriginal(
  item: ImageFetchItem,
  projectRoot: string,
  publicImagesDir: string,
  dryRun: boolean,
): RestoreResult {
  const assetPath = resolveAssetPath(item, projectRoot, publicImagesDir);
  const sourcePath = resolveOriginalPath(item, projectRoot, publicImagesDir);

  if (!fs.existsSync(sourcePath)) {
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath,
      error: `Original backup not found: ${toStoredPath(projectRoot, sourcePath)}`,
    };
  }

  if (dryRun) {
    return {
      label: item.label,
      status: "would_restore",
      assetPath,
      sourcePath,
    };
  }

  fs.mkdirSync(path.dirname(assetPath), { recursive: true });
  fs.rmSync(assetPath, { force: true });
  fs.copyFileSync(sourcePath, assetPath);
  delete item.cutout_success;
  delete item.cutout_error;
  delete item.cutout_path;
  delete item.cutout_source_path;

  return {
    label: item.label,
    status: "restored",
    assetPath,
    sourcePath,
  };
}

export function restoreOriginalsAndCutout(options: RestoreAndCutoutOptions): {
  restored: RestoreResult[];
  cutout: ReturnType<typeof processCutoutPlan>;
} {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const planPath = resolveImagePlanPath(projectRoot, options.planPath);
  const publicImagesDir = toAbsolutePath(
    projectRoot,
    options.publicImagesDir ?? "public/images",
  );
  const raw = fs.readFileSync(planPath, "utf-8");
  const items = parseImageFetchResponse(raw);
  const selectedLabels = new Set(options.labels);
  const itemsToRestore = items.filter(
    (item) => isCutoutCandidate(item) && matchesLabels(item, selectedLabels),
  );

  const restored = itemsToRestore.map((item) =>
    restoreOriginal(
      item,
      projectRoot,
      publicImagesDir,
      options.dryRun ?? false,
    ),
  );
  const failed = restored.filter((result) => result.status === "error");
  if (failed.length > 0 && !options.dryRun) {
    fs.writeFileSync(planPath, JSON.stringify(items, null, 2), "utf-8");
    throw new Error(
      `Restore failed for ${failed.length} item(s); background removal was not run.`,
    );
  }

  if (!options.dryRun) {
    fs.writeFileSync(planPath, JSON.stringify(items, null, 2), "utf-8");
  }

  const cutout = processCutoutPlan({
    ...options,
    projectRoot,
    planPath,
  });

  return { restored, cutout };
}

function parseArgs(argv: string[]): RestoreAndCutoutOptions {
  let dryRun = false;
  let rembgCommand = "rembg";
  let planPath = "";
  const labels: string[] = [];
  let alphaMin: number | undefined;
  let alphaMax: number | undefined;
  let outlineSize: number | undefined;
  let outlineColor: string | undefined;
  let outlineThreshold: number | undefined;
  let hardAlpha = false;
  let keepLargest = false;
  let smoothAlphaBlur: number | undefined;
  let smoothAlphaBlack: number | undefined;
  let smoothAlphaWhite: number | undefined;
  let thresholdAlpha: number | undefined;
  let requireLabel = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("--rembg=")) {
      rembgCommand = arg.slice("--rembg=".length);
    } else if (arg.startsWith("--label=")) {
      labels.push(arg.slice("--label=".length));
    } else if (arg.startsWith("--alpha-min=")) {
      alphaMin = Number(arg.slice("--alpha-min=".length));
    } else if (arg.startsWith("--alpha-max=")) {
      alphaMax = Number(arg.slice("--alpha-max=".length));
    } else if (arg.startsWith("--outline-size=")) {
      outlineSize = Number(arg.slice("--outline-size=".length));
    } else if (arg.startsWith("--outline-color=")) {
      outlineColor = arg.slice("--outline-color=".length);
    } else if (arg.startsWith("--outline-threshold=")) {
      outlineThreshold = Number(arg.slice("--outline-threshold=".length));
    } else if (arg === "--hard-alpha") {
      hardAlpha = true;
    } else if (arg === "--keep-largest") {
      keepLargest = true;
    } else if (arg.startsWith("--smooth-alpha-blur=")) {
      smoothAlphaBlur = Number(arg.slice("--smooth-alpha-blur=".length));
    } else if (arg.startsWith("--smooth-alpha-black=")) {
      smoothAlphaBlack = Number(arg.slice("--smooth-alpha-black=".length));
    } else if (arg.startsWith("--smooth-alpha-white=")) {
      smoothAlphaWhite = Number(arg.slice("--smooth-alpha-white=".length));
    } else if (arg.startsWith("--threshold-alpha=")) {
      thresholdAlpha = Number(arg.slice("--threshold-alpha=".length));
    } else if (arg === "--require-label") {
      requireLabel = true;
    } else if (!arg.startsWith("--") && !planPath) {
      planPath = arg;
    }
  }

  if (!planPath) {
    throw new Error(
      "Usage: npm run restore-background-remove:images -- [--dry-run] [--label=file.png] [--alpha-min=0-255] [--alpha-max=0-255] [--outline-size=0-256] [--outline-color=R,G,B,A] [--outline-threshold=0-255] [--hard-alpha] [--keep-largest] [--smooth-alpha-blur=N] [--smooth-alpha-black=0-100] [--smooth-alpha-white=0-100] [--threshold-alpha=0-255] prompts/<slug>-images.json",
    );
  }
  if (requireLabel && labels.length === 0) {
    throw new Error("This preset requires at least one --label=file.png argument.");
  }

  for (const [name, value] of [
    ["alpha-min", alphaMin],
    ["alpha-max", alphaMax],
    ["outline-size", outlineSize],
    ["outline-threshold", outlineThreshold],
    ["threshold-alpha", thresholdAlpha],
  ] as const) {
    const max = name === "outline-size" ? 256 : 255;
    if (value !== undefined && (!Number.isInteger(value) || value < 0 || value > max)) {
      throw new Error(`--${name} must be an integer from 0 to ${max}`);
    }
  }
  for (const [name, value] of [
    ["smooth-alpha-blur", smoothAlphaBlur],
    ["smooth-alpha-black", smoothAlphaBlack],
    ["smooth-alpha-white", smoothAlphaWhite],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) {
      throw new Error(`--${name} must be a number from 0 to 100`);
    }
  }
  if (
    smoothAlphaBlack !== undefined &&
    smoothAlphaWhite !== undefined &&
    smoothAlphaWhite <= smoothAlphaBlack
  ) {
    throw new Error("--smooth-alpha-white must be greater than --smooth-alpha-black");
  }
  if (outlineColor !== undefined && !/^\d{1,3},\d{1,3},\d{1,3},\d{1,3}$/.test(outlineColor)) {
    throw new Error("--outline-color must use R,G,B,A, for example 255,255,255,255");
  }

  return {
    planPath,
    dryRun,
    rembgCommand,
    labels,
    alphaMin,
    alphaMax,
    outlineSize,
    outlineColor,
    outlineThreshold,
    hardAlpha,
    keepLargest,
    smoothAlphaBlur,
    smoothAlphaBlack,
    smoothAlphaWhite,
    thresholdAlpha,
    requireLabel,
  };
}

export function main(): void {
  if (
    process.argv[1] &&
    path.basename(process.argv[1]) === "restore-originals-and-cutout.ts"
  ) {
    console.warn(
      "`npm run recut:images` is deprecated. Use `npm run restore-background-remove:images` instead.",
    );
  }

  const options = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const resolvedPlanPath = resolveImagePlanPath(projectRoot, options.planPath);
  if (toAbsolutePath(projectRoot, options.planPath) !== resolvedPlanPath) {
    console.log(`Using image plan: ${toStoredPath(projectRoot, resolvedPlanPath)}`);
  }

  const { restored, cutout } = restoreOriginalsAndCutout({
    ...options,
    projectRoot,
    planPath: resolvedPlanPath,
  });

  for (const result of restored) {
    const detail = result.error ?? toStoredPath(projectRoot, result.sourcePath);
    console.log(`${result.status.toUpperCase()}  ${result.label} (${detail})`);
  }

  for (const result of cutout.results) {
    if (result.status === "skipped") {
      continue;
    }
    const detail = result.error ?? result.assetPath ?? "";
    console.log(`${result.status.toUpperCase()}  ${result.label}${detail ? ` (${detail})` : ""}`);
  }

  const restoreErrors = restored.filter((result) => result.status === "error").length;
  const cutoutSelected = cutout.results.filter((result) => result.status !== "skipped");
  const cutoutErrors = cutoutSelected.filter((result) => result.status === "error").length;
  console.log(
    `Restore + background removal ${options.dryRun ? "dry run" : "run"} complete: restored ${restored.length}, processed ${cutoutSelected.length}, errors ${restoreErrors + cutoutErrors}`,
  );

  if (restoreErrors + cutoutErrors > 0) {
    process.exitCode = 1;
  }
}

const isEntrypoint = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isEntrypoint) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
