import fs from "node:fs";
import path from "node:path";

type CliOptions = {
  outPath: string;
  plain: boolean;
  promptsDir: string;
};

type NarrationFile = {
  path: string;
  fileName: string;
  topicSlug: string;
  segmentLabel?: string;
};

const DEFAULT_PROMPTS_DIR = "prompts/inspire";
const DEFAULT_OUT_PATH = path.join(DEFAULT_PROMPTS_DIR, "_combined-narrations.txt");

function printHelp(): void {
  console.log(`
Usage: tsx scripts/combine-inspire-narrations.ts [options]

Options:
  --out <path>          Output file path (default: ${DEFAULT_OUT_PATH})
  --prompts-dir <path>  Prompt artifact directory (default: ${DEFAULT_PROMPTS_DIR})
  --plain               Concatenate narration text without source headers
  --help                Show this help message
`);
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outPath: DEFAULT_OUT_PATH,
    plain: false,
    promptsDir: DEFAULT_PROMPTS_DIR,
  };
  let outPathProvided = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--plain") {
      options.plain = true;
      continue;
    }

    if (arg === "--out") {
      options.outPath = readOptionValue(args, i, "--out");
      outPathProvided = true;
      i++;
      continue;
    }

    if (arg.startsWith("--out=")) {
      options.outPath = arg.slice("--out=".length);
      outPathProvided = true;
      continue;
    }

    if (arg === "--prompts-dir") {
      options.promptsDir = readOptionValue(args, i, "--prompts-dir");
      i++;
      continue;
    }

    if (arg.startsWith("--prompts-dir=")) {
      options.promptsDir = arg.slice("--prompts-dir=".length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!outPathProvided && options.promptsDir !== DEFAULT_PROMPTS_DIR) {
    options.outPath = path.join(options.promptsDir, path.basename(DEFAULT_OUT_PATH));
  }

  return options;
}

function parseNarrationFile(promptsDir: string, fileName: string): NarrationFile {
  const segmentMatch = fileName.match(/^(.*)-seg-(\d+)-narration\.txt$/);
  const topicSlug = segmentMatch
    ? segmentMatch[1]
    : fileName.replace(/-narration\.txt$/, "");
  const segmentLabel = segmentMatch ? `Segment ${segmentMatch[2]}` : undefined;

  return {
    path: path.join(promptsDir, fileName),
    fileName,
    topicSlug,
    segmentLabel,
  };
}

function findNarrationFiles(promptsDir: string, outPath: string): NarrationFile[] {
  if (!fs.existsSync(promptsDir)) {
    return [];
  }

  const resolvedOutPath = path.resolve(outPath);

  return fs
    .readdirSync(promptsDir)
    .filter((fileName) => fileName.endsWith("-narration.txt"))
    .map((fileName) => parseNarrationFile(promptsDir, fileName))
    .filter((file) => path.resolve(file.path) !== resolvedOutPath)
    .sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeNarration(text: string): string {
  return text.trim();
}

function buildCombinedText(files: NarrationFile[], options: CliOptions): string {
  const sections = files.map((file) => {
    const narration = normalizeNarration(fs.readFileSync(file.path, "utf-8"));
    if (options.plain) return narration;

    const title = [titleFromSlug(file.topicSlug), file.segmentLabel].filter(Boolean).join(" - ");
    return [`## ${title}`, `Source: ${file.path}`, "", narration].join("\n");
  });

  if (options.plain) {
    return `${sections.join("\n\n")}\n`;
  }

  const header = [
    "# Combined Inspire Narrations",
    `Source directory: ${options.promptsDir}`,
    `Narration files: ${files.length}`,
  ].join("\n");

  return `${header}\n\n${sections.join("\n\n---\n\n")}\n`;
}

function writeCombinedNarrations(options: CliOptions): void {
  const files = findNarrationFiles(options.promptsDir, options.outPath);

  if (files.length === 0) {
    console.log(`No narration files found in ${options.promptsDir}/`);
    process.exit(0);
  }

  const combinedText = buildCombinedText(files, options);
  fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
  fs.writeFileSync(options.outPath, combinedText, "utf-8");

  console.log(`Combined ${files.length} narration file(s) into ${options.outPath}`);
}

try {
  writeCombinedNarrations(parseArgs(process.argv.slice(2)));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
