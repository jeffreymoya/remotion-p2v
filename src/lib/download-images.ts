import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { ImageFetchItem } from "./build-image-fetch-prompt";

export interface DownloadResult {
  label: string;
  path: string;
  ok: boolean;
  url?: string;
  sourceUrl?: string;
  error?: string;
}

const BLOCKED_IMAGE_HOSTS = new Set([
  "adobe.com",
  "alamy.com",
  "bigstockphoto.com",
  "depositphotos.com",
  "dreamstime.com",
  "envato.com",
  "freepik.com",
  "gettyimages.com",
  "iconscout.com",
  "istockphoto.com",
  "pngtree.com",
  "pond5.com",
  "rawpixel.com",
  "shutterstock.com",
  "stock.adobe.com",
  "storyblocks.com",
  "vecteezy.com",
  "vectorstock.com",
  "123rf.com",
  "cdn.pixabay.com",
]);
const DUCK_DUCK_GO_SEARCH_URL = "https://duckduckgo.com/";
const DUCK_DUCK_GO_IMAGES_URL = "https://duckduckgo.com/i.js";
const USER_AGENT =
  "Mozilla/5.0 (compatible; remotion-p2v-image-resolver/1.0; +https://duckduckgo.com/)";

interface ImageCandidate {
  imageUrl: string;
  sourceUrl?: string;
}

interface DuckDuckGoImageResult {
  image?: unknown;
  url?: unknown;
}

function sanitizeFilename(name: string): string {
  return path.basename(name);
}

function isBlockedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return [...BLOCKED_IMAGE_HOSTS].some(
    (blockedHost) =>
      normalized === blockedHost || normalized.endsWith(`.${blockedHost}`),
  );
}

function getUrlHost(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function validateCandidateSource(candidate: ImageCandidate): string | undefined {
  const imageHost = getUrlHost(candidate.imageUrl);
  const sourceHost = getUrlHost(candidate.sourceUrl);
  const blockedHost = [imageHost, sourceHost].find(
    (host) => host && isBlockedHost(host),
  );
  return blockedHost
    ? `${blockedHost} is blocked because stock image results are often watermarked`
    : undefined;
}

function validateImageUrl(url: string | undefined): { url?: string; error?: string } {
  if (!url) {
    return { error: "missing image_url" };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { error: "image_url must use HTTP or HTTPS" };
    }
    if (isBlockedHost(parsed.hostname)) {
      return {
        error: `${parsed.hostname} is blocked because stock image results are often watermarked`,
      };
    }
    return { url: parsed.toString() };
  } catch {
    return { error: "missing or invalid image_url" };
  }
}

function hasImageMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) ||
    buffer.subarray(0, 4).equals(Buffer.from("GIF8"))
  );
}

function shouldRejectFakeTransparency(item: ImageFetchItem): boolean {
  const text = [
    item.label,
    item.query,
    item.visual_requirements,
    item.rationale,
  ]
    .join(" ")
    .toLowerCase();

  return (
    path.extname(item.label).toLowerCase() === ".png" &&
    (item.preferred_format === "png" ||
      item.needs_cutout === true ||
      text.includes("transparent") ||
      text.includes("no background") ||
      text.includes("cutout"))
  );
}

function findPythonCommand(): string {
  const localPython = path.join(process.cwd(), ".venv", "bin", "python");
  return fs.existsSync(localPython) ? localPython : "python3";
}

export function validateDownloadedAsset(
  item: ImageFetchItem,
  filePath: string,
): string | undefined {
  if (!shouldRejectFakeTransparency(item)) {
    return undefined;
  }

  const script = `
from PIL import Image
import sys

path = sys.argv[1]
image = Image.open(path).convert("RGBA")
width, height = image.size
pixels = image.getdata()
total = width * height

transparent = sum(1 for _, _, _, alpha in pixels if alpha < 250)
if transparent / total > 0.01:
    sys.exit(0)

def bucket(pixel):
    r, g, b, _ = pixel
    if abs(r - g) > 8 or abs(g - b) > 8:
        return None
    if r >= 238:
        return 1
    if 185 <= r <= 235:
        return 2
    return None

neutral = 0
light = 0
gray = 0
for pixel in pixels:
    value = bucket(pixel)
    if value == 1:
        light += 1
        neutral += 1
    elif value == 2:
        gray += 1
        neutral += 1

neutral_ratio = neutral / total
if neutral_ratio < 0.35 or light == 0 or gray == 0:
    sys.exit(0)

light_ratio = light / total
gray_ratio = gray / total
if light_ratio > 0.12 and gray_ratio > 0.12:
    print("PNG appears to contain a baked checkerboard transparency preview instead of real alpha")
    sys.exit(2)

sample_step = max(1, min(width, height) // 80)
transitions = 0
comparisons = 0
last = None
for y in range(0, height, sample_step):
    last = None
    for x in range(0, width, sample_step):
        value = bucket(image.getpixel((x, y)))
        if value is None:
            last = None
            continue
        if last is not None:
            comparisons += 1
            if value != last:
                transitions += 1
        last = value

transition_ratio = transitions / comparisons if comparisons else 0
if transition_ratio > 0.18:
    print("PNG appears to contain a baked checkerboard transparency preview instead of real alpha")
    sys.exit(2)
`;

  const result = spawnSync(findPythonCommand(), ["-c", script, filePath], {
    encoding: "utf-8",
  });

  if (result.error) {
    return undefined;
  }

  if (result.status === 2) {
    return result.stdout.trim() || "PNG appears to contain fake transparency";
  }

  return undefined;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`DuckDuckGo search HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function extractDuckDuckGoVqd(html: string): string | undefined {
  return (
    html.match(/vqd=['"]([^'"]+)/)?.[1] ??
    html.match(/vqd=([^&"']+)/)?.[1]
  );
}

async function findDuckDuckGoCandidates(query: string): Promise<ImageCandidate[]> {
  const searchUrl = new URL(DUCK_DUCK_GO_SEARCH_URL);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("iax", "images");
  searchUrl.searchParams.set("ia", "images");

  const html = await fetchText(searchUrl.toString());
  const vqd = extractDuckDuckGoVqd(html);
  if (!vqd) {
    throw new Error("DuckDuckGo search token not found");
  }

  const imagesUrl = new URL(DUCK_DUCK_GO_IMAGES_URL);
  imagesUrl.searchParams.set("l", "us-en");
  imagesUrl.searchParams.set("o", "json");
  imagesUrl.searchParams.set("q", query);
  imagesUrl.searchParams.set("vqd", vqd);
  imagesUrl.searchParams.set("f", ",,,");
  imagesUrl.searchParams.set("p", "1");

  const res = await fetch(imagesUrl, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json, text/javascript, */*; q=0.1",
      referer: DUCK_DUCK_GO_SEARCH_URL,
    },
  });
  if (!res.ok) {
    throw new Error(`DuckDuckGo images HTTP ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as { results?: DuckDuckGoImageResult[] };
  return (body.results ?? [])
    .map((result) => ({
      imageUrl: typeof result.image === "string" ? result.image : "",
      sourceUrl: typeof result.url === "string" ? result.url : undefined,
    }))
    .filter((candidate) => candidate.imageUrl);
}

async function tryCandidate(
  item: ImageFetchItem,
  candidate: ImageCandidate,
  filePath: string,
): Promise<DownloadResult> {
  const sourceError = validateCandidateSource(candidate);
  if (sourceError) {
    return {
      label: item.label,
      path: filePath,
      ok: false,
      sourceUrl: candidate.sourceUrl,
      error: sourceError,
    };
  }

  const { url, error } = validateImageUrl(candidate.imageUrl);
  if (!url) {
    return {
      label: item.label,
      path: filePath,
      ok: false,
      sourceUrl: candidate.sourceUrl,
      error,
    };
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      return {
        label: item.label,
        path: filePath,
        ok: false,
        url,
        sourceUrl: candidate.sourceUrl,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!hasImageMagicBytes(buffer)) {
      return {
        label: item.label,
        path: filePath,
        ok: false,
        url,
        sourceUrl: candidate.sourceUrl,
        error: `non-image response (${contentType || "unknown content type"})`,
      };
    }

    fs.writeFileSync(filePath, buffer);
    const assetError = validateDownloadedAsset(item, filePath);
    if (assetError) {
      fs.rmSync(filePath, { force: true });
      return {
        label: item.label,
        path: filePath,
        ok: false,
        url,
        sourceUrl: candidate.sourceUrl,
        error: assetError,
      };
    }

    return {
      label: item.label,
      path: filePath,
      ok: true,
      url,
      sourceUrl: candidate.sourceUrl,
    };
  } catch (err) {
    return {
      label: item.label,
      path: filePath,
      ok: false,
      url,
      sourceUrl: candidate.sourceUrl,
      error: err instanceof Error ? err.message : "unknown download error",
    };
  }
}

export async function downloadOne(
  item: ImageFetchItem,
  outputDir: string,
): Promise<DownloadResult> {
  const filePath = path.join(outputDir, sanitizeFilename(item.label));

  let lastFailure: DownloadResult | undefined;
  if (item.image_url) {
    lastFailure = await tryCandidate(
      item,
      { imageUrl: item.image_url, sourceUrl: item.source_url },
      filePath,
    );
    if (lastFailure.ok) {
      return lastFailure;
    }
  }

  let searchCandidates: ImageCandidate[] = [];
  let searchError: string | undefined;
  try {
    searchCandidates = await findDuckDuckGoCandidates(item.query);
  } catch (err) {
    searchError = err instanceof Error ? err.message : "DuckDuckGo search failed";
  }

  for (const candidate of searchCandidates) {
    const result = await tryCandidate(item, candidate, filePath);
    if (result.ok) {
      return result;
    }
    lastFailure = result;
  }

  return {
    label: item.label,
    path: filePath,
    ok: false,
    url: lastFailure?.url,
    sourceUrl: lastFailure?.sourceUrl,
    error: lastFailure?.error ?? searchError ?? "no valid image candidates found",
  };
}

export async function downloadImages(
  items: ImageFetchItem[],
  outputDir: string,
  limiter?: <T>(task: () => Promise<T>) => Promise<T>,
): Promise<{ downloaded: number; failed: number; results: DownloadResult[] }> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tasks = items.map((item) => () => downloadOne(item, outputDir));

  const results = limiter
    ? await Promise.all(tasks.map((task) => limiter(task)))
    : await Promise.all(tasks.map((task) => task()));

  const downloaded = results.filter((r) => r.ok).length;
  const failed = results.length - downloaded;

  return { downloaded, failed, results };
}
