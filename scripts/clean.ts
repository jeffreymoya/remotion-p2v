import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeInspireScriptsModule } from "../src/lib/inspire/write-inspire-script";

type CliOptions = {
  dryRun: boolean;
};

type CleanupResult = {
  removedPaths: string[];
  regeneratedRegistry: boolean;
};

const PROMPTS_DIR = "prompts/inspire";
const AUDIO_DIR = "public/audio/inspire";
const VIDEO_DIR = "public/videos/inspire";
const GENERATED_REGISTRY = "src/generated/inspire-scripts.ts";
const TMP_DIR_PREFIXES = ["react-motion-render", "puppeteer_dev_chrome_profile-"];

function printHelp(): void {
  console.log(`
Usage: tsx scripts/clean.ts [options]

Options:
  --dry-run   Print what would be removed without deleting anything
  --help      Show this help message

The cleanup removes generated inspire artifacts and Remotion cache directories,
then regenerates src/generated/inspire-scripts.ts from any remaining prompt JSONs.
`);
}

function parseArgs(args: string[]): CliOptions {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  return {
    dryRun: args.includes("--dry-run"),
  };
}

function listDirectoryEntries(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory).map((entry) => path.join(directory, entry));
}

function collectPromptArtifacts(): string[] {
  if (!fs.existsSync(PROMPTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(PROMPTS_DIR)
    .filter((entry) => !entry.startsWith("_"))
    .filter((entry) => entry.endsWith(".json") || entry.endsWith(".txt"))
    .map((entry) => path.join(PROMPTS_DIR, entry));
}

function collectAudioArtifacts(): string[] {
  return listDirectoryEntries(AUDIO_DIR).filter((entry) => {
    return path.basename(entry) !== ".DS_Store";
  });
}

function collectVideoArtifacts(): string[] {
  return listDirectoryEntries(VIDEO_DIR).filter((entry) => {
    return path.basename(entry) !== ".DS_Store";
  });
}

function collectRemotionCacheTargets(): string[] {
  const homeDir = os.homedir();
  const tmpDir = os.tmpdir();
  const persistentTargets = [
    path.join(process.cwd(), "node_modules/.remotion"),
    path.join(homeDir, ".cache/remotion"),
    path.join(homeDir, ".remotion"),
  ];

  const tempTargets = fs.existsSync(tmpDir)
    ? fs
        .readdirSync(tmpDir)
        .filter((entry) => TMP_DIR_PREFIXES.some((prefix) => entry.startsWith(prefix)))
        .map((entry) => path.join(tmpDir, entry))
    : [];

  return [...persistentTargets, ...tempTargets];
}

function collectCleanupTargets(): string[] {
  const targets = [
    ...collectPromptArtifacts(),
    ...collectAudioArtifacts(),
    ...collectVideoArtifacts(),
    ...collectRemotionCacheTargets(),
  ];

  return [...new Set(targets)].filter((target) => fs.existsSync(target));
}

function removePath(targetPath: string, dryRun: boolean): void {
  const suffix = fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory() ? "/" : "";

  if (dryRun) {
    console.log(`  [dry-run] remove: ${targetPath}${suffix}`);
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log(`  [clean] removed: ${targetPath}${suffix}`);
}

function regenerateRegistry(dryRun: boolean): boolean {
  if (dryRun) {
    console.log(`  [dry-run] regenerate: ${GENERATED_REGISTRY}`);
    return false;
  }

  writeInspireScriptsModule();
  console.log(`  [clean] regenerated: ${GENERATED_REGISTRY}`);
  return true;
}

function cleanArtifacts(options: CliOptions): CleanupResult {
  const targets = collectCleanupTargets();

  targets.forEach((target) => {
    removePath(target, options.dryRun);
  });

  const regeneratedRegistry = regenerateRegistry(options.dryRun);

  return {
    removedPaths: targets,
    regeneratedRegistry,
  };
}

function printSummary(result: CleanupResult, dryRun: boolean): void {
  if (result.removedPaths.length === 0) {
    console.log(dryRun ? "  [dry-run] nothing to remove" : "  [clean] nothing to remove");
  }

  const action = dryRun ? "would remove" : "removed";
  const registryMessage = dryRun
    ? "would regenerate registry"
    : result.regeneratedRegistry
      ? "regenerated registry"
      : "did not regenerate registry";

  console.log(`\nSummary: ${action} ${result.removedPaths.length} path(s), ${registryMessage}.`);
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const result = cleanArtifacts(options);
  printSummary(result, options.dryRun);
}

main();