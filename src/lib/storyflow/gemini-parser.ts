/**
 * Gemini CLI Output Parser
 *
 * Handles various output formats from the Gemini CLI:
 * - Raw JSON
 * - Markdown-fenced JSON (```json...```)
 * - Wrapper format: { response: "..." }
 * - Double-escaped strings
 */

import { z } from "zod";

const geminiWrapperSchema = z
  .object({
    response: z.string(),
  })
  .partial()
  .passthrough();

/**
 * Strip markdown code fences from text
 */
export function stripMarkdownBlocks(text: string): string {
  const fenced = text.match(/```json([\s\S]*?)```/);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }
  const fencedAny = text.match(/```([\s\S]*?)```/);
  if (fencedAny && fencedAny[1]) {
    return fencedAny[1].trim();
  }
  return text.trim();
}

/**
 * Attempt to find and extract JSON from text that may contain
 * extra content before or after the JSON
 */
function extractJsonFromText(text: string): string {
  // Try to find JSON object boundaries
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Try to find JSON array boundaries
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return text;
}

/**
 * Parse Gemini CLI output robustly
 *
 * Handles:
 * 1. Direct JSON output
 * 2. Markdown-fenced JSON
 * 3. Wrapper format: { response: "stringified json" }
 * 4. Double-escaped content
 *
 * @param stdout - Raw stdout from Gemini CLI
 * @returns Parsed JSON object
 */
export function parseGeminiOutput<T = unknown>(stdout: string): T {
  let text = stdout.trim();

  // Step 1: Strip markdown fences if present
  text = stripMarkdownBlocks(text);

  // Step 2: Try to extract JSON from any surrounding text
  text = extractJsonFromText(text);

  // Step 3: Try direct parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (firstError) {
    // Step 4: Try unescaping common escape sequences that might be double-escaped
    try {
      // Replace literal \n, \t, \r with actual characters
      const unescaped = text
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"');

      const extracted = extractJsonFromText(unescaped);
      parsed = JSON.parse(extracted);
    } catch {
      // Log the problematic output for debugging
      console.error(
        "[gemini-parser] Failed to parse output. First 500 chars:",
        text.substring(0, 500)
      );
      throw firstError;
    }
  }

  // Step 5: Handle wrapper format { response: "..." }
  const maybeWrapped = geminiWrapperSchema.safeParse(parsed);
  if (maybeWrapped.success && maybeWrapped.data.response) {
    const innerText = maybeWrapped.data.response;

    // The inner response might also need cleaning
    const innerCleaned = stripMarkdownBlocks(innerText);

    try {
      return JSON.parse(innerCleaned) as T;
    } catch {
      // Try with extraction
      const extracted = extractJsonFromText(innerCleaned);
      try {
        return JSON.parse(extracted) as T;
      } catch {
        // Try unescaping the inner content
        try {
          const unescaped = innerCleaned
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "\r")
            .replace(/\\"/g, '"');

          const unescapedExtracted = extractJsonFromText(unescaped);
          return JSON.parse(unescapedExtracted) as T;
        } catch {
          // If all parsing fails, return the parsed wrapper
          // (maybe the response wasn't meant to be JSON)
          console.warn(
            "[gemini-parser] Could not parse inner response as JSON, returning wrapper"
          );
          return parsed as T;
        }
      }
    }
  }

  return parsed as T;
}

/**
 * Parse Gemini output and validate against a Zod schema
 */
export function parseGeminiOutputWithSchema<T>(
  stdout: string,
  schema: z.ZodType<T>
): T {
  const parsed = parseGeminiOutput<unknown>(stdout);
  return schema.parse(parsed);
}
