import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseImageFetchResponse,
  type ImageFetchItem,
} from "../src/lib/build-image-fetch-prompt";

type CutoutStatus = "skipped" | "would_cutout" | "cutout" | "error";

export interface CutoutResult {
  label: string;
  status: CutoutStatus;
  assetPath?: string;
  sourcePath?: string;
  reason?: string;
  error?: string;
}

export interface CutoutPlanOptions {
  planPath: string;
  projectRoot?: string;
  dryRun?: boolean;
  publicImagesDir?: string;
  rembgCommand?: string;
  labels?: string[];
  alphaMin?: number;
  alphaMax?: number;
  outlineSize?: number;
  outlineColor?: string;
  outlineThreshold?: number;
  hardAlpha?: boolean;
  keepLargest?: boolean;
  smoothAlphaBlur?: number;
  smoothAlphaBlack?: number;
  smoothAlphaWhite?: number;
  thresholdAlpha?: number;
}

interface NormalizedCutoutPlanOptions
  extends Required<
    Omit<
      CutoutPlanOptions,
      | "planPath"
      | "alphaMin"
      | "alphaMax"
      | "outlineSize"
      | "outlineColor"
      | "outlineThreshold"
      | "smoothAlphaBlur"
      | "smoothAlphaBlack"
      | "smoothAlphaWhite"
      | "thresholdAlpha"
    >
  > {
  alphaMin?: number;
  alphaMax?: number;
  outlineSize?: number;
  outlineColor?: string;
  outlineThreshold?: number;
  smoothAlphaBlur?: number;
  smoothAlphaBlack?: number;
  smoothAlphaWhite?: number;
  thresholdAlpha?: number;
}

const CUTOUT_ROLES = new Set<ImageFetchItem["asset_role"]>([
  "animated_object",
  "static_overlay",
]);

export function isCutoutCandidate(item: ImageFetchItem): boolean {
  return (
    CUTOUT_ROLES.has(item.asset_role) &&
    (item.needs_background_removal === true || item.needs_cutout === true)
  );
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

export function resolveImagePlanPath(projectRoot: string, planPath: string): string {
  const absolutePlanPath = toAbsolutePath(projectRoot, planPath);
  if (path.extname(absolutePlanPath) !== ".txt") {
    return absolutePlanPath;
  }

  const imagePlanPath = absolutePlanPath.replace(/\.txt$/, "-images.json");
  if (fs.existsSync(imagePlanPath)) {
    return imagePlanPath;
  }

  throw new Error(
    `Background-removal input must be an image plan JSON file. Received prompt text: ${toStoredPath(projectRoot, absolutePlanPath)}\n` +
      `Expected matching image plan: ${toStoredPath(projectRoot, imagePlanPath)}`,
  );
}

function resolveAssetPath(
  item: ImageFetchItem,
  projectRoot: string,
  publicImagesDir: string,
): { assetPath: string; exists: boolean } {
  const candidates = [
    item.resolved_path ? toAbsolutePath(projectRoot, item.resolved_path) : undefined,
    path.join(publicImagesDir, safeLabel(item.label)),
  ].filter((candidate): candidate is string => Boolean(candidate));

  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return {
    assetPath: existing ?? candidates[0],
    exists: Boolean(existing),
  };
}

function clearCutoutError(item: ImageFetchItem): void {
  delete item.cutout_error;
  item.cutout_success = true;
}

function markCutoutError(item: ImageFetchItem, message: string): void {
  item.cutout_success = false;
  item.cutout_error = message;
}

function formatProcessError(status: number | null, stderr: string, stdout: string): string {
  const details = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n");
  const suffix = details ? `: ${details}` : "";
  return `rembg failed${status === null ? "" : ` with exit code ${status}`}${suffix}`;
}

function resolveRembgCommand(projectRoot: string, command: string): string {
  if (command !== "rembg") {
    return command;
  }

  const localRembg = path.join(projectRoot, ".venv", "bin", "rembg");
  return fs.existsSync(localRembg) ? localRembg : command;
}

function assertRembgAvailable(command: string): void {
  const result = spawnSync(command, ["--help"], {
    encoding: "utf-8",
  });

  if (result.error) {
    const installHint =
      result.error.message.includes("ENOENT")
        ? "RemBG CLI not found. Install RemBG and make sure `rembg` is on PATH before running background removal."
        : result.error.message;
    throw new Error(installHint);
  }
}

function resolvePythonCommand(rembgCommand: string): string {
  const siblingPython = path.join(path.dirname(rembgCommand), "python");
  return fs.existsSync(siblingPython) ? siblingPython : "python3";
}

function cleanupAlpha(
  filePath: string,
  rembgCommand: string,
  alphaMin?: number,
  alphaMax?: number,
): void {
  if (alphaMin === undefined && alphaMax === undefined) {
    return;
  }

  const script = `
from PIL import Image
import sys

path = sys.argv[1]
alpha_min = None if sys.argv[2] == "" else int(sys.argv[2])
alpha_max = None if sys.argv[3] == "" else int(sys.argv[3])

image = Image.open(path).convert("RGBA")
r, g, b, a = image.split()

def clean(value):
    if alpha_min is not None and value < alpha_min:
        return 0
    if alpha_max is not None and value > alpha_max:
        return 255
    return value

image.putalpha(a.point(clean))
image.save(path)
`;

  const result = spawnSync(
    resolvePythonCommand(rembgCommand),
    [
      "-c",
      script,
      filePath,
      alphaMin === undefined ? "" : String(alphaMin),
      alphaMax === undefined ? "" : String(alphaMax),
    ],
    { encoding: "utf-8" },
  );

  if (result.error) {
    throw new Error(`alpha cleanup failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      formatProcessError(result.status, result.stderr ?? "", result.stdout ?? ""),
    );
  }
}

function hardenAlpha(filePath: string, rembgCommand: string, threshold: number): void {
  const script = `
from PIL import Image
import sys

path = sys.argv[1]
threshold = int(sys.argv[2])
image = Image.open(path).convert("RGBA")
r, g, b, a = image.split()
image.putalpha(a.point(lambda value: 255 if value >= threshold else 0))
image.save(path)
`;

  const result = spawnSync(
    resolvePythonCommand(rembgCommand),
    ["-c", script, filePath, String(threshold)],
    { encoding: "utf-8" },
  );

  if (result.error) {
    throw new Error(`hard alpha failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      formatProcessError(result.status, result.stderr ?? "", result.stdout ?? ""),
    );
  }
}

function smoothAlpha(
  filePath: string,
  rembgCommand: string,
  blur?: number,
  blackPoint?: number,
  whitePoint?: number,
): void {
  if (blur === undefined) {
    return;
  }

  const script = `
from PIL import Image, ImageFilter
import sys

path = sys.argv[1]
blur = float(sys.argv[2])
black_point = float(sys.argv[3])
white_point = float(sys.argv[4])

image = Image.open(path).convert("RGBA")
r, g, b, a = image.split()
a = a.filter(ImageFilter.GaussianBlur(blur))
black = 255 * black_point / 100
white = 255 * white_point / 100
if white <= black:
    raise ValueError("smooth alpha white point must be greater than black point")

def level(value):
    if value <= black:
        return 0
    if value >= white:
        return 255
    return round((value - black) * 255 / (white - black))

image.putalpha(a.point(level))
image.save(path)
`;

  const result = spawnSync(
    resolvePythonCommand(rembgCommand),
    [
      "-c",
      script,
      filePath,
      String(blur),
      String(blackPoint ?? 10),
      String(whitePoint ?? 100),
    ],
    { encoding: "utf-8" },
  );

  if (result.error) {
    throw new Error(`smooth alpha failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      formatProcessError(result.status, result.stderr ?? "", result.stdout ?? ""),
    );
  }
}

function keepLargestAlphaComponent(
  filePath: string,
  rembgCommand: string,
  threshold: number,
): void {
  const script = `
from collections import deque
from PIL import Image
import sys

path = sys.argv[1]
threshold = int(sys.argv[2])
image = Image.open(path).convert("RGBA")
alpha = image.getchannel("A")
width, height = image.size
mask = bytearray(1 if value >= threshold else 0 for value in alpha.getdata())
visited = bytearray(width * height)
best = []

for start, value in enumerate(mask):
    if value == 0 or visited[start]:
        continue
    component = []
    queue = deque([start])
    visited[start] = 1
    while queue:
        index = queue.popleft()
        component.append(index)
        x = index % width
        y = index // width
        for neighbor in (index - 1, index + 1, index - width, index + width):
            if neighbor < 0 or neighbor >= width * height:
                continue
            nx = neighbor % width
            ny = neighbor // width
            if abs(nx - x) + abs(ny - y) != 1:
                continue
            if mask[neighbor] and not visited[neighbor]:
                visited[neighbor] = 1
                queue.append(neighbor)
    if len(component) > len(best):
        best = component

keep = bytearray(width * height)
for index in best:
    keep[index] = 1

pixels = list(image.getdata())
cleaned = []
for index, pixel in enumerate(pixels):
    if keep[index]:
        cleaned.append(pixel)
    else:
        cleaned.append((pixel[0], pixel[1], pixel[2], 0))
image.putdata(cleaned)
image.save(path)
`;

  const result = spawnSync(
    resolvePythonCommand(rembgCommand),
    ["-c", script, filePath, String(threshold)],
    { encoding: "utf-8" },
  );

  if (result.error) {
    throw new Error(`connected component cleanup failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      formatProcessError(result.status, result.stderr ?? "", result.stdout ?? ""),
    );
  }
}

function addOutline(
  filePath: string,
  rembgCommand: string,
  outlineSize?: number,
  outlineColor?: string,
  outlineThreshold?: number,
): void {
  if (!outlineSize || outlineSize <= 0) {
    return;
  }

  const script = `
from PIL import Image, ImageFilter
import sys

path = sys.argv[1]
size = int(sys.argv[2])
color = tuple(int(part) for part in sys.argv[3].split(","))
threshold = int(sys.argv[4])
if len(color) != 4:
    raise ValueError("outline color must be R,G,B,A")

image = Image.open(path).convert("RGBA")
padding = size
expanded = Image.new("RGBA", (image.width + padding * 2, image.height + padding * 2), (0, 0, 0, 0))
expanded.alpha_composite(image, (padding, padding))

alpha = expanded.getchannel("A")
source_alpha = alpha.point(lambda value: 255 if value >= threshold else 0)
outline_alpha = source_alpha.filter(ImageFilter.MaxFilter(size * 2 + 1))
outline = Image.new("RGBA", expanded.size, color)
outline.putalpha(outline_alpha)
outline.alpha_composite(expanded)
outline.save(path)
`;

  const result = spawnSync(
    resolvePythonCommand(rembgCommand),
    [
      "-c",
      script,
      filePath,
      String(outlineSize),
      outlineColor ?? "255,255,255,255",
      String(outlineThreshold ?? 128),
    ],
    { encoding: "utf-8" },
  );

  if (result.error) {
    throw new Error(`outline failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      formatProcessError(result.status, result.stderr ?? "", result.stdout ?? ""),
    );
  }
}

export function processCutoutItem(
  item: ImageFetchItem,
  options: NormalizedCutoutPlanOptions,
): CutoutResult {
  if (!isCutoutCandidate(item)) {
    return {
      label: item.label,
      status: "skipped",
      reason:
        "asset_role is not animated_object/static_overlay or needs_background_removal is not true",
    };
  }

  const publicImagesDir = toAbsolutePath(options.projectRoot, options.publicImagesDir);
  const { assetPath, exists } = resolveAssetPath(
    item,
    options.projectRoot,
    publicImagesDir,
  );
  const backupPath = path.join(path.dirname(assetPath), ".originals", safeLabel(item.label));

  item.cutout_path = toStoredPath(options.projectRoot, assetPath);
  item.cutout_source_path = toStoredPath(options.projectRoot, backupPath);

  if (path.extname(item.label).toLowerCase() !== ".png") {
    const error =
      `Background-removal target label "${item.label}" must end in .png. ` +
      "Change the image plan label and composition reference before running background removal.";
    markCutoutError(item, error);
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath: backupPath,
      error,
    };
  }

  if (!exists) {
    const error =
      `Asset file not found for "${item.label}". Expected resolved_path or ` +
      `public/images/${safeLabel(item.label)} to exist.`;
    markCutoutError(item, error);
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath: backupPath,
      error,
    };
  }

  if (options.dryRun) {
    return {
      label: item.label,
      status: "would_cutout",
      assetPath,
      sourcePath: backupPath,
    };
  }

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(assetPath, backupPath);
  }

  const result = spawnSync(options.rembgCommand, ["i", backupPath, assetPath], {
    encoding: "utf-8",
  });

  if (result.error) {
    const error =
      result.error.message.includes("ENOENT")
        ? `rembg CLI not found. Install RemBG, then retry: ${result.error.message}`
        : result.error.message;
    markCutoutError(item, error);
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath: backupPath,
      error,
    };
  }

  if (result.status !== 0) {
    const error = formatProcessError(
      result.status,
      result.stderr ?? "",
      result.stdout ?? "",
    );
    markCutoutError(item, error);
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath: backupPath,
      error,
    };
  }

  try {
    cleanupAlpha(
      assetPath,
      options.rembgCommand,
      options.alphaMin,
      options.alphaMax,
    );
    if (options.keepLargest) {
      keepLargestAlphaComponent(
        assetPath,
        options.rembgCommand,
        options.outlineThreshold ?? options.alphaMin ?? 128,
      );
    }
    addOutline(
      assetPath,
      options.rembgCommand,
      options.outlineSize,
      options.outlineColor,
      options.outlineThreshold,
    );
    if (options.hardAlpha) {
      hardenAlpha(assetPath, options.rembgCommand, options.outlineThreshold ?? 128);
    }
    smoothAlpha(
      assetPath,
      options.rembgCommand,
      options.smoothAlphaBlur,
      options.smoothAlphaBlack,
      options.smoothAlphaWhite,
    );
    if (options.thresholdAlpha !== undefined) {
      hardenAlpha(assetPath, options.rembgCommand, options.thresholdAlpha);
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "post-processing failed";
    markCutoutError(item, error);
    return {
      label: item.label,
      status: "error",
      assetPath,
      sourcePath: backupPath,
      error,
    };
  }

  clearCutoutError(item);
  return {
    label: item.label,
    status: "cutout",
    assetPath,
    sourcePath: backupPath,
  };
}

export function processCutoutPlan(options: CutoutPlanOptions): {
  items: ImageFetchItem[];
  results: CutoutResult[];
} {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const planPath = resolveImagePlanPath(projectRoot, options.planPath);
  const normalizedOptions: NormalizedCutoutPlanOptions = {
    projectRoot,
    dryRun: options.dryRun ?? false,
    publicImagesDir: options.publicImagesDir ?? "public/images",
    rembgCommand: resolveRembgCommand(
      projectRoot,
      options.rembgCommand ?? "rembg",
    ),
    labels: options.labels ?? [],
    alphaMin: options.alphaMin,
    alphaMax: options.alphaMax,
    outlineSize: options.outlineSize,
    outlineColor: options.outlineColor,
    outlineThreshold: options.outlineThreshold,
    hardAlpha: options.hardAlpha ?? false,
    keepLargest: options.keepLargest ?? false,
    smoothAlphaBlur: options.smoothAlphaBlur,
    smoothAlphaBlack: options.smoothAlphaBlack,
    smoothAlphaWhite: options.smoothAlphaWhite,
    thresholdAlpha: options.thresholdAlpha,
  };

  const raw = fs.readFileSync(planPath, "utf-8");
  const items = parseImageFetchResponse(raw);
  const selectedLabels = new Set(normalizedOptions.labels);
  const itemsToProcess =
    selectedLabels.size === 0
      ? items
      : items.filter((item) => selectedLabels.has(item.label));
  if (!normalizedOptions.dryRun && itemsToProcess.some(isCutoutCandidate)) {
    assertRembgAvailable(normalizedOptions.rembgCommand);
  }

  const results = itemsToProcess.map((item) =>
    processCutoutItem(item, normalizedOptions),
  );

  if (!normalizedOptions.dryRun) {
    fs.writeFileSync(planPath, JSON.stringify(items, null, 2), "utf-8");
  }

  return { items, results };
}

function parseArgs(argv: string[]): CutoutPlanOptions {
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
    } else if (!arg.startsWith("--") && !planPath) {
      planPath = arg;
    }
  }

  if (!planPath) {
    throw new Error(
      "Usage: npm run background-remove:images -- [--dry-run] [--rembg=rembg] [--label=file.png] [--alpha-min=0-255] [--alpha-max=0-255] [--outline-size=0-256] [--outline-color=R,G,B,A] [--outline-threshold=0-255] [--hard-alpha] [--keep-largest] [--smooth-alpha-blur=N] [--smooth-alpha-black=0-100] [--smooth-alpha-white=0-100] [--threshold-alpha=0-255] prompts/<slug>-images.json\n" +
        "You may also pass prompts/<slug>.txt when the matching prompts/<slug>-images.json exists.",
    );
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
  };
}

export function main(): void {
  if (process.argv[1] && path.basename(process.argv[1]) === "cutout-images.ts") {
    console.warn(
      "`npm run cutout:images` is deprecated. Use `npm run background-remove:images` instead.",
    );
  }

  const options = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const resolvedPlanPath = resolveImagePlanPath(projectRoot, options.planPath);
  if (toAbsolutePath(projectRoot, options.planPath) !== resolvedPlanPath) {
    console.log(`Using image plan: ${toStoredPath(projectRoot, resolvedPlanPath)}`);
  }

  const { items, results } = processCutoutPlan({
    ...options,
    projectRoot,
    planPath: resolvedPlanPath,
  });

  for (const result of results) {
    if (result.status === "skipped") {
      continue;
    }

    const detail = result.error ?? result.reason ?? result.assetPath ?? "";
    console.log(`${result.status.toUpperCase()}  ${result.label}${detail ? ` (${detail})` : ""}`);
  }

  const selected = results.filter((result) => result.status !== "skipped");
  const failed = selected.filter((result) => result.status === "error");
  if (selected.length === 0) {
    const missingRoleMetadata = items.every((item) => item.asset_role === undefined);
    if (missingRoleMetadata) {
      console.log(
        "No eligible background-removal items found. This image plan has no asset_role metadata; regenerate the image plan or mark object items with asset_role and needs_background_removal.",
      );
    } else {
      console.log(
        "No eligible background-removal items found. Only animated_object/static_overlay items with needs_background_removal: true are processed.",
      );
    }
  }

  const action = options.dryRun ? "would process" : "processed";
  console.log(
    `Background removal ${options.dryRun ? "dry run" : "run"} complete: ${action} ${selected.length}, errors ${failed.length}`,
  );

  if (failed.length > 0) {
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
