import fs from "node:fs";
import { traceable } from "langsmith/traceable";
import { PIXABAY_BASE_URL, PIXABAY_TIMEOUT_MS } from "./config";

const USER_AGENT =
  "Mozilla/5.0 (compatible; remotion-p2v-image-resolver/1.0)";

interface PixabayHit {
  largeImageURL?: string;
  webformatURL?: string;
}

interface PixabayResponse {
  totalHits?: number;
  hits?: PixabayHit[];
}

function hasImageMagicBytes(buffer: Buffer): boolean {
  return (
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    buffer
      .subarray(0, 8)
      .equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ) ||
    (buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
      buffer.subarray(8, 12).equals(Buffer.from("WEBP"))) ||
    buffer.subarray(0, 4).equals(Buffer.from("GIF8"))
  );
}

export const searchAndDownload = traceable(searchAndDownloadImpl, {
  name: "pixabay_search",
  run_type: "tool",
});

async function searchAndDownloadImpl(
  query: string,
  destPath: string,
): Promise<{ ok: boolean; path?: string; error?: string }> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "PIXABAY_API_KEY is not set in environment" };
  }

  const url = new URL(PIXABAY_BASE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("per_page", "5");
  url.searchParams.set("safesearch", "true");

  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `Pixabay API HTTP ${res.status} ${res.statusText}`,
      };
    }

    const body = (await res.json()) as PixabayResponse;
    const hits = body.hits ?? [];
    if (hits.length === 0) {
      return { ok: false, error: `no Pixabay results for "${query}"` };
    }

    const imageUrl = hits[0].largeImageURL ?? hits[0].webformatURL;
    if (!imageUrl) {
      return { ok: false, error: "no usable image URL in Pixabay result" };
    }

    const imgRes = await fetch(imageUrl, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS),
    });

    if (!imgRes.ok) {
      return {
        ok: false,
        error: `Pixabay image download HTTP ${imgRes.status}`,
      };
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (!hasImageMagicBytes(buffer)) {
      return {
        ok: false,
        error: "downloaded file is not a recognized image format",
      };
    }

    const dir = destPath.substring(0, destPath.lastIndexOf("/"));
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(destPath, buffer);

    return { ok: true, path: destPath };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
