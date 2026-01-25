import { NextResponse } from "next/server";
import { env } from "@/src/env";
import { assetsLogger } from "@/src/lib/logger";
import { withLogging } from "@/src/lib/api-logger";

const PEXELS_API_KEY = env.PEXELS_API_KEY;

type PexelsPhoto = {
  id: number;
  photographer: string;
  src: { medium: string; large: string; original: string };
};

export const GET = withLogging(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "Stock search not configured (missing PEXELS_API_KEY)" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = typeof body.error === "string" ? body.error : "Stock search failed";
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const data = (await res.json()) as { photos: PexelsPhoto[] };
    const results =
      data.photos?.map((photo) => ({
        id: String(photo.id),
        previewUrl: photo.src.medium || photo.src.large || photo.src.original,
        downloadUrl: photo.src.original,
        photographer: photo.photographer,
        type: "IMAGE",
        source: "pexels",
      })) ?? [];

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    assetsLogger.error({ query, error: message }, "Asset search failed");
    return NextResponse.json({ error: "Stock search failed" }, { status: 500 });
  }
});
