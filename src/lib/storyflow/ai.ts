import { z } from "zod";
import { getSettings } from "./settings";
import { parseGeminiOutput } from "./gemini-parser";
import { scriptSchema, ScriptPayload } from "./scripts";
import { TrendingTopic, GeneralizedTrendingTopic, TopicSuggestion } from "./discovery";
import { countWords, WORDS_PER_MINUTE } from "../constants";
import { geminiCall } from "@/src/lib/services/ai";
import { aiLogger } from "@/src/lib/logger";

function estimateWordCount(text: string): { wordCount: number; estimatedDuration: number } {
  const words = countWords(text);
  const estimatedDuration = Math.round((words / WORDS_PER_MINUTE.SCRIPT_GENERATION) * 60);
  return { wordCount: words, estimatedDuration };
}

function normalizeScript(parsed: Record<string, unknown>, topic: string): ScriptPayload {
  const segments = Array.isArray(parsed?.segments) ? parsed.segments : [];
  const withIndexes =
    segments.map((seg: unknown, idx: number) => {
      const segment = seg as Record<string, unknown>;
      const text = String(segment.text ?? segment.segment ?? "");
      const { wordCount, estimatedDuration } = estimateWordCount(text);
      return {
        index: typeof segment.index === "number" ? segment.index : idx + 1,
        text,
        wordCount: typeof segment.wordCount === "number" ? segment.wordCount : wordCount,
        estimatedDuration:
          typeof segment.estimatedDuration === "number"
            ? segment.estimatedDuration
            : typeof segment.estimatedDurationMs === "number"
            ? Math.round(segment.estimatedDurationMs / 1000)
            : estimatedDuration,
        audioUrl: typeof segment.audioUrl === "string" ? segment.audioUrl : undefined,
        actualDuration: typeof segment.actualDuration === "number" ? segment.actualDuration : undefined,
        timestamps: Array.isArray(segment.timestamps) ? segment.timestamps : undefined,
      };
    });

  const candidate: ScriptPayload = {
    title: typeof parsed.title === "string" ? parsed.title : `${topic} — StoryFlow Script`,
    segments: withIndexes,
  };

  return scriptSchema.parse(candidate);
}

export async function generateScriptFromGemini(
  projectId: string,
  topic: string
): Promise<ScriptPayload> {
  const settings = await getSettings();
  const model = settings.ai.proModel;

  const prompt = `
You are a professional video scriptwriter. Create an engaging script for a video about: ${topic}

Requirements:
- 8-12 segments, conversational tone
- Provide clear narrative arc (hook, build, conclusion)
- Return JSON only, no markdown code fences.
{
  "title": "Video title",
  "segments": [
    { "index": 1, "text": "segment text", "wordCount": 120, "estimatedDuration": 50 }
  ]
}
`;

  try {
    const { rawResponse } = await geminiCall<Record<string, unknown>>(
      { projectId, operation: "script-generate" },
      prompt,
      { model }
    );

    const parsed = parseGeminiOutput(rawResponse ?? "");
    return normalizeScript(parsed, topic);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    aiLogger.warn({ projectId, topic, error: message }, "Gemini failed, falling back to demo script");
    throw error;
  }
}

// Schema for generalized topics response
const generalizedTopicsSchema = z.object({
  trendingTopics: z.array(z.object({
    originalTrend: z.string(),
    traffic: z.string(),
    suggestions: z.array(z.object({
      title: z.string(),
      angle: z.string(),
      description: z.string(),
      viralPotential: z.number().min(0).max(100),
    })),
  })),
});

function formatTopicsForPrompt(trends: TrendingTopic[]): string {
  return trends.map((t, i) => {
    const headlines = t.newsItems.map(n => `  - "${n.title}" (${n.source || 'unknown'})`).join('\n');
    return `${i + 1}. **${t.query}** (traffic: ${t.traffic || 'unknown'})
   News headlines:
${headlines || '   - No headlines available'}`;
  }).join('\n\n');
}

export async function generalizeTopics(
  projectId: string,
  trends: TrendingTopic[],
  suggestionsPerTopic = 4
): Promise<GeneralizedTrendingTopic[]> {
  const settings = await getSettings();
  const model = settings.ai.model;

  const topicsWithContext = formatTopicsForPrompt(trends);

  const prompt = `You are a YouTube content strategist specializing in transforming trending news into evergreen, engaging video content for ages 20-40.

Given these trending topics with their associated news headlines:
${topicsWithContext}

Your task:
For EACH trending topic, generate ${suggestionsPerTopic} generalized video ideas that:
1. Transform the specific news into a broader, more searchable topic
2. Have evergreen appeal (not tied to specific dates/events)
3. Are suitable for 12-minute educational/explanatory videos
4. Would perform well on YouTube with good search volume

Guidelines for generalization:
- "Oprah says obesity is a disease" → "Is Obesity Actually a Disease? The Science Explained"
- "Celebrity uses weight loss drug" → "How GLP-1 Drugs Are Changing Medicine Forever"
- "Company announces layoffs" → "Why Tech Companies Are Cutting Jobs"
- Focus on: WHY, HOW, WHAT IF, THE TRUTH ABOUT, EXPLAINED formats

For each suggestion, provide:
- A YouTube-optimized title (compelling, searchable)
- The angle (scientific, controversial, educational, myth-busting, explainer, how-to)
- A brief description of what the video would cover
- Viral potential score (0-100)

CRITICAL: Return ONLY this exact JSON structure (no markdown blocks, no extra text):
{
  "trendingTopics": [
    {
      "originalTrend": "the original trending topic name",
      "traffic": "traffic volume from RSS",
      "suggestions": [
        {
          "title": "YouTube-optimized video title",
          "angle": "scientific|controversial|educational|myth-busting|explainer|how-to",
          "description": "2-3 sentences about what the video would cover",
          "viralPotential": 85
        }
      ]
    }
  ]
}

IMPORTANT:
- Process ALL trending topics provided
- Each topic MUST have exactly ${suggestionsPerTopic} suggestions
- Suggestions should be distinct angles, not variations of the same idea
- Prioritize topics that are educational, thought-provoking, or solve problems`;

  try {
    const { rawResponse } = await geminiCall<Record<string, unknown>>(
      { projectId, operation: "topic-generalize" },
      prompt,
      { model }
    );

    aiLogger.debug({
      projectId,
      operation: "topic-generalize",
      rawOutputPreview: (rawResponse ?? "").substring(0, 500)
    }, "Raw Gemini output received");

    const parsed = parseGeminiOutput(rawResponse ?? "");
    const validated = generalizedTopicsSchema.parse(parsed);

    let suggestionCounter = 0;

    return validated.trendingTopics.map((topic, trendIdx) => {
      const rawTrend = trends.find(r =>
        r.query.toLowerCase() === topic.originalTrend.toLowerCase()
      ) || trends[trendIdx];

      return {
        id: `trend-${trendIdx + 1}`,
        originalTrend: topic.originalTrend,
        traffic: rawTrend?.traffic ?? topic.traffic,
        picture: rawTrend?.picture,
        newsHeadlines: rawTrend?.newsItems.map(n => n.title) || [],
        suggestions: topic.suggestions.map((s): TopicSuggestion => {
          suggestionCounter++;
          return {
            id: `suggestion-${suggestionCounter}`,
            title: s.title,
            angle: s.angle,
            description: s.description,
            viralPotential: s.viralPotential,
          };
        }),
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";
    aiLogger.error({ projectId, error: message }, "Topic generalization failed");
    throw error;
  }
}
