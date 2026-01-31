import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, parseQuery, withErrorHandler } from "@/app/api/lib";
import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";

const requestSchema = z.object({
  geo: z.string().min(2).max(10).optional(),
  category: z.coerce.number().int().optional(),
}).partial().default({});

async function getTopics(payload: z.infer<typeof requestSchema>) {
  const geo = payload.geo ?? "US";
  const category = payload.category;
  const topics = await fetchTrendingTopics(geo, category);
  return NextResponse.json({ topics });
}

export const GET = withErrorHandler(async (req: Request) => {
  const data = parseQuery(req, requestSchema);
  return getTopics(data);
}, "discover");

export const POST = withErrorHandler(async (req: Request) => {
  const data = await parseBody(req, requestSchema);
  return getTopics(data);
}, "discover");
