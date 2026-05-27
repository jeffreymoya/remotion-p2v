// YouTube interview clip extraction spike.
//
// Usage:
//   npx tsx --env-file=.env scripts/youtube-spike.ts
//
// Searches for Greenspan Black Monday 1987 clips, extracts auto-captions via yt-dlp,
// matches the target phrase, and downloads a timestamped segment.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, unlinkSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { searchVideos, type VideoCandidate } from "../src/lib/docu/youtube-client";

// ── Spike config (hardcoded per design) ──────────────────────────────────────

const SEARCH_QUERY = "Alan Greenspan Black Monday 1987 crash liquidity";
const TARGET_PHRASES = ["unlimited liquidity", "liquidity", "pledged"];
const LEAD_SEC = 5;
const TRAIL_SEC = 8;
const OUTPUT_SLUG = "how-the-fed-controls-your-money";
const MAX_RESULTS = 5;

const TMP_DIR = join(".tmp", "youtube");
const OUTPUT_DIR = join("public", "videos", "docu", "interview-clips", OUTPUT_SLUG);

// ── Helpers ──────────────────────────────────────────────────────────────────

function ytdlp(args: string[]): { stdout: string; stderr: string; status: number | null } {
  const cmd = "yt-dlp";
  const result = spawnSync(cmd, args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  });
  return {
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status,
  };
}

interface VttCue {
  start: number;
  end: number;
  text: string;
}

function parseVtt(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  const lines = raw.split(/\r?\n/);
  let i = 0;

  // Skip WEBVTT header
  while (i < lines.length && (lines[i].startsWith("WEBVTT") || lines[i].trim() === "")) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip cue identifiers (numeric or empty)
    if (line === "" || /^\d+$/.test(line)) {
      i++;
      continue;
    }

    // Match timestamp line: "00:00:00.000 --> 00:00:01.000"
    const tsMatch = line.match(
      /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/,
    );
    if (tsMatch) {
      const start =
        parseInt(tsMatch[1]) * 3600 +
        parseInt(tsMatch[2]) * 60 +
        parseInt(tsMatch[3]) +
        parseInt(tsMatch[4]) / 1000;
      const end =
        parseInt(tsMatch[5]) * 3600 +
        parseInt(tsMatch[6]) * 60 +
        parseInt(tsMatch[7]) +
        parseInt(tsMatch[8]) / 1000;

      // Collect text lines until blank line or end
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      const text = textLines.join(" ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
      if (text) {
        cues.push({ start, end, text });
      }
    } else {
      i++;
    }
  }
  return cues;
}

function findPhrase(
  cues: VttCue[],
  targets: string[],
): { cue: VttCue; matchedTarget: string } | null {
  for (const target of targets) {
    const targetLower = target.toLowerCase();
    for (const cue of cues) {
      if (cue.text.toLowerCase().includes(targetLower)) {
        return { cue, matchedTarget: target };
      }
    }
  }
  return null;
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

// ── Step runners ─────────────────────────────────────────────────────────────

async function stepSearch(): Promise<VideoCandidate | null> {
  const result = await searchVideos(SEARCH_QUERY, MAX_RESULTS);

  if (result.candidates.length === 0) {
    console.log("[spike] No videos found for query.");
    return null;
  }

  for (let i = 0; i < result.candidates.length; i++) {
    const video = result.candidates[i];
    console.log(`\n  [${i + 1}] ${video.title}`);
    console.log(`      Channel: ${video.channelTitle}`);
    console.log(`      ID:      ${video.videoId}`);
  }

  // Pick first result automatically for spike
  const video = result.candidates[0];
  console.log(`\n[spike] Selected: "${video.title}"`);
  return video;
}

function stepTranscript(videoId: string): string | null {
  ensureDir(TMP_DIR);
  const vttPath = join(TMP_DIR, `${videoId}.en.vtt`);

  // Clean up stale VTT if present
  if (existsSync(vttPath)) {
    unlinkSync(vttPath);
  }

  console.log(`[spike] Extracting auto-captions for ${videoId}...`);
  const result = ytdlp([
    "--skip-download",
    "--write-auto-subs",
    "--convert-subs", "vtt",
    "-o", join(TMP_DIR, "%(id)s"),
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  if (result.status !== 0) {
    console.error(`[spike] yt-dlp transcript extraction failed (exit ${result.status})`);
    if (result.stderr) console.error(`  stderr: ${result.stderr.slice(0, 500)}`);
    return null;
  }

  if (!existsSync(vttPath)) {
    console.error(`[spike] VTT file not found at ${vttPath}`);
    // List what was actually created
    console.error(`  .tmp/youtube contents: ${readdirSync(TMP_DIR).join(", ")}`);
    return null;
  }

  const raw = readFileSync(vttPath, "utf-8");
  console.log(`[spike] Transcript extracted: ${vttPath} (${raw.length} bytes)`);
  return raw;
}

function stepMatch(vttRaw: string): VttCue | null {
  const cues = parseVtt(vttRaw);
  console.log(`[spike] Parsed ${cues.length} caption cues`);

  const result = findPhrase(cues, TARGET_PHRASES);
  if (!result) {
    console.log(`[spike] No target phrase matched in transcript. Tried: ${TARGET_PHRASES.join(", ")}`);
    return null;
  }

  console.log(
    `[spike] Matched "${result.matchedTarget}" at ${result.cue.start.toFixed(1)}s — "${result.cue.text}"`,
  );
  return result.cue;
}

function stepDownload(videoId: string, startSec: number, endSec: number): string | null {
  ensureDir(OUTPUT_DIR);
  const startInt = Math.max(0, Math.floor(startSec));
  const endInt = Math.ceil(endSec);

  const outFile = join(OUTPUT_DIR, `youtube-${videoId}-${startInt}-${endInt}.mp4`);
  const outTemplate = join(OUTPUT_DIR, `youtube-${videoId}-%(section_start)d-%(section_end)d.%(ext)s`);

  console.log(`[spike] Downloading clip: ${startInt}s → ${endInt}s (${endInt - startInt}s duration)`);

  const result = ytdlp([
    `--download-sections`, `*${startInt}-${endInt}`,
    "-f", "best[height<=1080][ext=mp4]/best[height<=1080]/best",
    "--merge-output-format", "mp4",
    "-o", outTemplate,
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  if (result.status !== 0) {
    console.error(`[spike] yt-dlp download failed (exit ${result.status})`);
    if (result.stderr) console.error(`  stderr: ${result.stderr.slice(0, 500)}`);
    return null;
  }

  if (!existsSync(outFile)) {
    // yt-dlp may have put the file at a slightly different name — find it
    const dirEntries = readdirSync(OUTPUT_DIR);
    for (const entry of dirEntries) {
      if (entry.startsWith(`youtube-${videoId}-`) && entry.endsWith(".mp4")) {
        const found = join(OUTPUT_DIR, entry);
        console.log(`[spike] Clip saved: ${found}`);
        return found;
      }
    }
    console.error(`[spike] Output file not found. Dir contents: ${dirEntries.join(", ")}`);
    return null;
  }

  console.log(`[spike] Clip saved: ${outFile}`);
  return outFile;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== YouTube Interview Clip Extraction Spike ===\n");

  // 1. Search
  const video = await stepSearch();
  if (!video) {
    console.log("[spike] Exiting — no video found.");
    process.exit(0);
  }

  // 2. Transcript
  const vttRaw = stepTranscript(video.videoId);
  if (!vttRaw) {
    console.log("[spike] Exiting — transcript extraction failed.");
    process.exit(1);
  }

  // 3. Match phrase
  const matchedCue = stepMatch(vttRaw);
  const clipCenter = matchedCue ? matchedCue.start : 37; // fallback: hardcoded estimate

  // 4. Download clip
  const startSec = clipCenter - LEAD_SEC;
  const endSec = clipCenter + TRAIL_SEC;
  const outputPath = stepDownload(video.videoId, startSec, endSec);

  if (!outputPath) {
    console.log("[spike] Exiting — download failed.");
    process.exit(1);
  }

  // 5. Summary
  console.log("\n=== Spike Complete ===");
  console.log(`  Video:       ${video.title}`);
  console.log(`  Video ID:    ${video.videoId}`);
  console.log(`  Phrase:      ${matchedCue ? `"${matchedCue.text}"` : "fallback estimate"}`);
  console.log(`  Clip window: ${startSec.toFixed(1)}s → ${endSec.toFixed(1)}s`);
  console.log(`  Output:      ${outputPath}`);
}

main().catch((err) => {
  console.error("[spike] Unexpected error:", err);
  process.exit(1);
});
