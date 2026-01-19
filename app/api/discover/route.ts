import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";

const requestSchema = z
  .object({
    geo: z.string().min(2).max(10).optional(),
    category: z.number().int().optional(),
  })
  .optional();

async function getTopics(payload: z.infer<typeof requestSchema>) {
  const geo = payload?.geo ?? "US";
  const category = payload?.category;
  const topics = await fetchTrendingTopics(geo, category);
  return NextResponse.json({ topics });
}

export async function GET() {
  return getTopics(undefined);
}

export async function POST(req: Request) {
  const body = await req
    .json()
    .catch(() => null) as z.infer<typeof requestSchema>;

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  return getTopics(parsed.data);
}
