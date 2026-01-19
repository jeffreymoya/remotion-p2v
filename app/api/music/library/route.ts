import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPixabayMusic } from "@/src/lib/storyflow/music/pixabay";

const querySchema = z.object({
  q: z.string().optional(),
  mood: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") || undefined,
    mood: searchParams.get("mood") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const tracks = await searchPixabayMusic(parsed.data.q ?? "background", parsed.data.mood);
    return NextResponse.json({ tracks });
  } catch (error: unknown) {
    const message = (error as { message?: string })?.message || "Unable to load music library";
    const status = message.includes("PIXABAY_API_KEY") ? 503 : 502;
    return NextResponse.json({ tracks: [], error: message }, { status });
  }
}
