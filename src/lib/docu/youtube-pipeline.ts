// YouTube interview clip extraction pipeline.
//
// Ported from the spike script (scripts/youtube-spike.ts) with production
// parameterization, json3 caption parsing, two-phase phrase matching (exact
// substring + fuzzy Levenshtein fallback), and shot-merging logic.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { distance } from "fastest-levenshtein";
import { searchVideos } from "./youtube-client";
import type { SentenceScheduleInput, ScheduledShot } from "./shot-scheduler";
import { FPS } from "../config";

// ── Data contracts ──────────────────────────────────────────────────────

export interface YouTubeClipSpec {
  sentenceIndex: number;
  searchQuery: string;
  targetPhrases: string[];
  leadSec?: number;
  trailSec?: number;
}

export interface ClipCandidateInfo {
  sentenceIndex: number;
  anchorId: string;
  anchorClaim: string;
  personName?: string;
  sourceLabel?: string;
}

export interface InterviewCaptionWord {
  word: string;
  startMs: number;
  endMs: number;
  isMatch: boolean;
  wordIndexInEvent: number;
}

export interface YouTubeClipResult {
  sentenceIndex: number;
  success: boolean;
  videoId?: string;
  videoTitle?: string;
  channelTitle?: string;
  matchedPhrase?: string;
  matchedTimestampSec?: number;
  clipStartSec?: number;
  clipEndSec?: number;
  videoPath?: string;
  captionWords?: InterviewCaptionWord[];
}

export interface MergedShot {
  startFrame: number;
  endFrame: number;
  palette: "cool-tech" | "warm-real";
  mediaType: "video" | "image";
  videoPath?: string;
  startFrom?: number;
  captionWords?: InterviewCaptionWord[];
  originalIndex?: number;
}

export interface CitationBlock {
  startFrame: number;
  endFrame: number;
  videoPath: string;
  anchorId: string;
  sentenceIndex: number;
  captionWords?: InterviewCaptionWord[];
  name?: string;
  sourceLabel?: string;
}

// ── json3 parsing types ────────────────────────────────────────────────

interface Json3Seg {
  utf8: string;
  tOffsetMs?: number;
}

interface Json3Event {
  tStartMs: number;
  dDurationMs?: number;
  segs?: Json3Seg[];
}

interface FlatWord {
  text: string;
  absMs: number;
  eventIdx: number;
  segIdx: number;
}

// ── yt-dlp helpers ─────────────────────────────────────────────────────

const TMP_DIR = join(".tmp", "youtube");

function ytdlp(args: string[], opts?: { timeout?: number }): { stdout: string; stderr: string; status: number | null } {
  const result = spawnSync("yt-dlp", args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: opts?.timeout ?? 120_000,
  });
  return {
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status,
  };
}

export function checkYtdlpAvailable(): boolean {
  const r = ytdlp(["--version"], { timeout: 10_000 });
  return r.status === 0;
}

// ── json3 caption parsing ──────────────────────────────────────────────

export function parseJson3(raw: string): Json3Event[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const events = (parsed as Record<string, unknown>).events ?? parsed;
  if (!Array.isArray(events)) return [];
  return events as Json3Event[];
}

export function flattenEvents(events: Json3Event[]): FlatWord[] {
  const out: FlatWord[] = [];
  for (let eIdx = 0; eIdx < events.length; eIdx++) {
    const event = events[eIdx];
    const segs = event.segs;
    if (!segs || segs.length === 0) continue;
    for (let sIdx = 0; sIdx < segs.length; sIdx++) {
      const seg = segs[sIdx];
      if (seg.utf8 === "\n") continue;
      const text = seg.utf8.replace(/^ +/, "");
      if (!text) continue;
      const absMs = event.tStartMs + (seg.tOffsetMs ?? 0);
      out.push({ text, absMs, eventIdx: eIdx, segIdx: sIdx });
    }
  }
  return out;
}

// ── Two-phase phrase matching ──────────────────────────────────────────

export interface PhraseMatch {
  startMs: number;
  matchEndMs: number;
  matchedTarget: string;
  matchMethod: "exact" | "fuzzy";
}

export function findPhraseInEvents(
  flatWords: FlatWord[],
  targets: string[],
): PhraseMatch | null {
  if (flatWords.length === 0 || targets.length === 0) return null;

  // Phase 1 — exact case-insensitive substring
  const fullText = flatWords.map((w) => w.text).join(" ");
  const fullLower = fullText.toLowerCase();

  // Build character-offset-to-word-index mapping for exact-match timestamp recovery
  const charToWord: number[] = [];
  for (let i = 0; i < flatWords.length; i++) {
    const word = flatWords[i];
    for (let c = 0; c < word.text.length; c++) {
      charToWord.push(i);
    }
    // Space between words
    charToWord.push(i);
    // Also push for the space
  }

  for (const target of targets) {
    const targetLower = target.toLowerCase();
    const idx = fullLower.indexOf(targetLower);
    if (idx >= 0) {
      const endIdx = idx + targetLower.length - 1;
      const firstWordIdx = charToWord[Math.min(idx, charToWord.length - 1)];
      const lastWordIdx = charToWord[Math.min(endIdx, charToWord.length - 1)];
      return {
        startMs: flatWords[firstWordIdx].absMs,
        matchEndMs: flatWords[lastWordIdx].absMs,
        matchedTarget: target,
        matchMethod: "exact",
      };
    }
  }

  // Phase 2 — fuzzy Levenshtein on sliding 3–5 word window
  const WINDOW_SIZES = [5, 4, 3];
  for (const windowSize of WINDOW_SIZES) {
    for (let i = 0; i <= flatWords.length - windowSize; i++) {
      const window = flatWords.slice(i, i + windowSize);
      const windowText = window.map((w) => w.text).join(" ").toLowerCase();
      for (const target of targets) {
        const d = distance(windowText, target.toLowerCase());
        if (d <= 2) {
          return {
            startMs: window[0].absMs,
            matchEndMs: window[window.length - 1].absMs,
            matchedTarget: target,
            matchMethod: "fuzzy",
          };
        }
      }
    }
  }

  return null;
}

// ── Caption word extraction ────────────────────────────────────────────

export function extractCaptionWords(
  events: Json3Event[],
  clipStartMs: number,
  clipEndMs: number,
  matchSpan?: { startMs: number; matchEndMs: number },
): InterviewCaptionWord[] {
  const flat = flattenEvents(events);
  const windowWords = flat.filter((w) => w.absMs >= clipStartMs && w.absMs <= clipEndMs);

  // Group words by event for per-event wordIndexInEvent
  const eventWordCounters = new Map<number, number>();
  const result: InterviewCaptionWord[] = [];

  for (const w of windowWords) {
    const wordIdx = eventWordCounters.get(w.eventIdx) ?? 0;
    eventWordCounters.set(w.eventIdx, wordIdx + 1);

    // Estimate endMs: start of next word, or a fixed estimate
    const nextWord = flat.find((f) => f.absMs > w.absMs);
    const estimatedEndMs = nextWord ? nextWord.absMs : w.absMs + 300;

    const offsetStartMs = Math.max(0, w.absMs - clipStartMs);
    const offsetEndMs = Math.min(clipEndMs - clipStartMs, estimatedEndMs - clipStartMs);

    const isMatch = matchSpan
      ? w.absMs >= matchSpan.startMs && w.absMs <= matchSpan.matchEndMs
      : false;

    result.push({
      word: w.text,
      startMs: offsetStartMs,
      endMs: Math.max(offsetStartMs + 1, offsetEndMs),
      isMatch,
      wordIndexInEvent: wordIdx,
    });
  }

  return result;
}

// ── Core extraction pipeline ───────────────────────────────────────────

const DEFAULT_LEAD_SEC = 10;
const DEFAULT_TRAIL_SEC = 35;
const TALKING_HEAD_SEC = 10;
const CUTBACK_HEAD_SEC = 10;
const MIN_CUTBACK_BLOCK_SEC = TALKING_HEAD_SEC + 20 + CUTBACK_HEAD_SEC;
const MAX_CITATION_FRACTION = 0.45;
const MAX_CANDIDATE_RETRIES = 3;

export async function runYouTubeClipExtraction(
  slug: string,
  specs: YouTubeClipSpec[],
): Promise<YouTubeClipResult[]> {
  const results: YouTubeClipResult[] = [];

  for (const spec of specs) {
    console.log(`\n[youtube] Clip spec for sentence ${spec.sentenceIndex}: "${spec.searchQuery}"`);
    const result = await extractSingleClip(slug, spec);
    results.push(result);
  }

  return results;
}

async function extractSingleClip(
  slug: string,
  spec: YouTubeClipSpec,
): Promise<YouTubeClipResult> {
  const leadSec = spec.leadSec ?? DEFAULT_LEAD_SEC;
  const trailSec = spec.trailSec ?? DEFAULT_TRAIL_SEC;

  // 1. Search
  let candidates;
  try {
    const searchResult = await searchVideos(spec.searchQuery, 5);
    candidates = searchResult.candidates;
  } catch (err) {
    console.warn(`[youtube] Search failed for sentence ${spec.sentenceIndex}: ${(err as Error).message}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  if (candidates.length === 0) {
    console.warn(`[youtube] No search results for sentence ${spec.sentenceIndex}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  // 2. Try up to MAX_CANDIDATE_RETRIES for caption extraction
  let events: Json3Event[] | null = null;
  let matchedVideo: typeof candidates[0] | null = null;

  for (const candidate of candidates.slice(0, MAX_CANDIDATE_RETRIES)) {
    const captionRaw = tryDownloadJson3Captions(candidate.videoId);
    if (captionRaw) {
      matchedVideo = candidate;
      try {
        events = parseJson3(captionRaw);
        break;
      } catch {
        console.warn(`[youtube] Failed to parse json3 for ${candidate.videoId}`);
      }
    }
  }

  if (!events || !matchedVideo) {
    console.warn(`[youtube] No usable captions for sentence ${spec.sentenceIndex}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  // 3. Phrase matching
  const flatWords = flattenEvents(events);
  const phraseMatch = findPhraseInEvents(flatWords, spec.targetPhrases);

  if (!phraseMatch) {
    console.warn(`[youtube] Phrase not found for sentence ${spec.sentenceIndex}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  const matchedTimestampMs = phraseMatch.startMs;
  const matchedTimestampSec = matchedTimestampMs / 1000;
  console.log(
    `[youtube] Matched "${phraseMatch.matchedTarget}" (${phraseMatch.matchMethod}) at ${matchedTimestampSec.toFixed(1)}s in "${matchedVideo.title}"`,
  );

  // 4. Calculate clip window
  const clipStartSec = Math.max(0, matchedTimestampSec - leadSec);
  const clipEndSec = matchedTimestampSec + trailSec;

  // 5. Download clip
  const outputDir = join("public", "videos", "docu", "interview-clips", slug);
  mkdirSync(outputDir, { recursive: true });

  const startInt = Math.floor(clipStartSec);
  const endInt = Math.ceil(clipEndSec);
  const outTemplate = join(outputDir, `youtube-${matchedVideo.videoId}-%(section_start)d-%(section_end)d.%(ext)s`);

  console.log(`[youtube] Downloading clip: ${startInt}s → ${endInt}s`);

  const dlResult = ytdlp([
    "--download-sections", `*${startInt}-${endInt}`,
    "-f", "bestvideo[protocol=dash][height<=1080]+bestaudio[protocol=dash]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
    "--merge-output-format", "mp4",
    "-o", outTemplate,
    `https://www.youtube.com/watch?v=${matchedVideo.videoId}`,
  ], { timeout: 180_000 });

  if (dlResult.status !== 0) {
    console.warn(`[youtube] Download failed for sentence ${spec.sentenceIndex}: ${dlResult.stderr.slice(0, 300)}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  // Find the actual output file
  const expectedFile = join(outputDir, `youtube-${matchedVideo.videoId}-${startInt}-${endInt}.mp4`);
  let videoPath: string | null = null;
  if (existsSync(expectedFile)) {
    videoPath = expectedFile;
  } else {
    const dirEntries = readdirSync(outputDir);
    for (const entry of dirEntries) {
      if (entry.startsWith(`youtube-${matchedVideo.videoId}-`) && entry.endsWith(".mp4")) {
        videoPath = join(outputDir, entry);
        break;
      }
    }
  }

  if (!videoPath) {
    console.warn(`[youtube] Output file not found for sentence ${spec.sentenceIndex}`);
    return { sentenceIndex: spec.sentenceIndex, success: false };
  }

  // 6. Extract caption words from the clip window
  const clipStartMs = clipStartSec * 1000;
  const clipEndMs = clipEndSec * 1000;
  const captionWords = extractCaptionWords(events, clipStartMs, clipEndMs, {
    startMs: phraseMatch.startMs,
    matchEndMs: phraseMatch.matchEndMs,
  });

  // Convert to relative path (what the composition expects via staticFile)
  const relativePath = videoPath.replace(/^public\//, "");

  console.log(`[youtube] Clip saved: ${relativePath} (${captionWords.length} caption words)`);

  return {
    sentenceIndex: spec.sentenceIndex,
    success: true,
    videoId: matchedVideo.videoId,
    videoTitle: matchedVideo.title,
    channelTitle: matchedVideo.channelTitle,
    matchedPhrase: phraseMatch.matchedTarget,
    matchedTimestampSec,
    clipStartSec,
    clipEndSec,
    videoPath: relativePath,
    captionWords: captionWords.length > 0 ? captionWords : undefined,
  };
}

function tryDownloadJson3Captions(videoId: string): string | null {
  mkdirSync(TMP_DIR, { recursive: true });
  const json3Path = join(TMP_DIR, `${videoId}.en.json3`);

  if (existsSync(json3Path)) {
    unlinkSync(json3Path);
  }

  const result = ytdlp([
    "--skip-download",
    "--write-auto-subs",
    "--sub-format", "json3/en",
    "-o", join(TMP_DIR, "%(id)s"),
    `https://www.youtube.com/watch?v=${videoId}`,
  ], { timeout: 60_000 });

  if (result.status !== 0) {
    return null;
  }

  if (!existsSync(json3Path)) {
    return null;
  }

  const raw = readFileSync(json3Path, "utf-8");
  return raw;
}

// ── Shot merging ───────────────────────────────────────────────────────

const STUB_MIN_FRAMES = 12;

export function mergeYouTubeClipsIntoShots(
  shots: ScheduledShot[],
  results: YouTubeClipResult[],
  sentenceFrameRanges: Array<{ startFrame: number; endFrame: number }>,
  totalDurationFrames: number,
  sentenceIndexToAnchorId?: Map<number, string>,
): { shots: MergedShot[]; citationBlocks: CitationBlock[] } {
  const fps = FPS;
  const talkingHeadFrames = TALKING_HEAD_SEC * fps;

  // 1. Convert successful results to CitationBlocks and reserved talking-head windows
  const citationBlocks: CitationBlock[] = [];
  const reserved: Array<{
    startFrame: number;
    endFrame: number;
    result: YouTubeClipResult;
    isCutback?: boolean;
  }> = [];

  // Sort by sentence index for deterministic ordering before overlap guard
  const sortedResults = [...results]
    .filter((r) => r.success && r.clipStartSec !== undefined && r.clipEndSec !== undefined)
    .sort((a, b) => a.sentenceIndex - b.sentenceIndex);

  let cumulativeBlockFrames = 0;

  for (const result of sortedResults) {
    const sent = sentenceFrameRanges[result.sentenceIndex];
    if (!sent) continue;

    const blockStart = sent.endFrame;
    const clipDurationFrames = Math.round((result.clipEndSec! - result.clipStartSec!) * fps);
    const blockEnd = blockStart + clipDurationFrames;

    // Overflow guard: skip if cumulative blocks exceed MAX_CITATION_FRACTION of total
    if (cumulativeBlockFrames + clipDurationFrames > MAX_CITATION_FRACTION * totalDurationFrames) {
      console.warn(
        `[youtube] Citation block at sentence ${result.sentenceIndex} would exceed ${MAX_CITATION_FRACTION * 100}% of video — dropping`,
      );
      continue;
    }

    // Overlap guard: skip if blockStart overlaps previous block's end
    const lastBlock = citationBlocks[citationBlocks.length - 1];
    if (lastBlock && blockStart < lastBlock.endFrame) {
      console.warn(
        `[youtube] Citation block at sentence ${result.sentenceIndex} overlaps earlier block (sentence ${lastBlock.sentenceIndex}) — dropping`,
      );
      continue;
    }

    cumulativeBlockFrames += clipDurationFrames;

    // Reserve the talking-head window for video replacement
    reserved.push({
      startFrame: blockStart,
      endFrame: blockStart + talkingHeadFrames,
      result,
    });

    // Mid-citation cutback: if block is long enough, add a second talking-head window
    const blockDurationFrames = blockEnd - blockStart;
    if (blockDurationFrames >= MIN_CUTBACK_BLOCK_SEC * fps) {
      const cutbackStart = blockEnd - CUTBACK_HEAD_SEC * fps;
      reserved.push({
        startFrame: cutbackStart,
        endFrame: blockEnd,
        result,
        isCutback: true,
      });
    }

    citationBlocks.push({
      startFrame: blockStart,
      endFrame: blockEnd,
      videoPath: result.videoPath!,
      anchorId: sentenceIndexToAnchorId?.get(result.sentenceIndex) ?? "",
      sentenceIndex: result.sentenceIndex,
      captionWords: result.captionWords,
    });
  }

  // 2. Merge image shots with reserved talking-head ranges
  const survived: MergedShot[] = [];

  for (const shot of shots) {
    let s = shot.startFrame;
    let e = shot.endFrame;
    let wasFullyConsumed = false;

    for (const range of reserved) {
      // Shot fully inside range — drop entirely
      if (s >= range.startFrame && e <= range.endFrame) {
        wasFullyConsumed = true;
        break;
      }
      // Shot starts before range, ends inside
      if (s < range.startFrame && e > range.startFrame && e <= range.endFrame) {
        e = range.startFrame;
      }
      // Shot starts inside range, ends after
      if (s >= range.startFrame && s < range.endFrame && e > range.endFrame) {
        s = range.endFrame;
      }
      // Shot spans the range entirely
      if (s < range.startFrame && e > range.endFrame) {
        // Front stub
        if (range.startFrame - s >= STUB_MIN_FRAMES) {
          survived.push({
            startFrame: s,
            endFrame: range.startFrame,
            palette: shot.palette,
            mediaType: "image",
          });
        }
        // Back stub
        s = range.endFrame;
      }
    }

    if (!wasFullyConsumed) {
      const duration = e - s;
      if (duration >= STUB_MIN_FRAMES) {
        const originalIndex = shots.indexOf(shot);
        survived.push({
          startFrame: s,
          endFrame: e,
          palette: shot.palette,
          mediaType: "image",
          originalIndex,
        });
      }
    }
  }

  // 3. Insert talking-head video shots (muted — audio lives in CitationBlock Audio elements)
  for (const range of reserved) {
    const shot: MergedShot = {
      startFrame: range.startFrame,
      endFrame: range.endFrame,
      palette: "cool-tech",
      mediaType: "video",
      videoPath: range.result.videoPath,
    };
    if (range.isCutback) {
      shot.startFrom = range.startFrame - reserved.find(
        (r) => r.result.sentenceIndex === range.result.sentenceIndex && !r.isCutback,
      )!.startFrame;
    }
    survived.push(shot);
  }

  // 4. Sort by startFrame
  survived.sort((a, b) => a.startFrame - b.startFrame);

  return { shots: survived, citationBlocks };
}
