import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";
import { generalizeTopics } from "@/src/lib/storyflow/ai";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  geo: z.string().min(2).max(10).optional(),
  category: z.number().int().optional(),
  suggestionsPerTopic: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { projectId, geo = "US", category, suggestionsPerTopic = 4 } = parsed.data;

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
  } catch (error) {
    console.error("[api/discover/generalize] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generalize topics" },
      { status: 500 }
    );
  }
}
