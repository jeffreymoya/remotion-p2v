import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";
import { generalizeTopics } from "@/src/lib/storyflow/ai";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  geo: z.string().min(2).max(10).optional(),
  category: z.coerce.number().int().optional(),
  suggestionsPerTopic: z.coerce.number().int().min(1).max(10).optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, geo = "US", category, suggestionsPerTopic = 4 } = await parseBody(
    req,
    requestSchema
  );

  // Step 1: Fetch raw trending topics with news context
  const rawTopics = await fetchTrendingTopics(geo, category);

  if (rawTopics.length === 0) {
    return NextResponse.json({
      trendingTopics: [],
      message: "No trending topics available",
    });
  }

  // Step 2: Generate generalized suggestions via AI
  const generalizedTopics = await generalizeTopics(projectId, rawTopics, suggestionsPerTopic);

  return NextResponse.json({
    trendingTopics: generalizedTopics,
    totalTrends: generalizedTopics.length,
    totalSuggestions: generalizedTopics.reduce((acc, t) => acc + t.suggestions.length, 0),
  });
}, "discover/generalize");
