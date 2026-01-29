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
 * Unescape a string that contains JSON string escape sequences (e.g. literal \n, \", \\).
 * Uses a single-pass regex so that \\\", \\n, etc. are handled correctly
 * (the \\\\ is consumed first, preventing the following \" from being misinterpreted).
 */
export function unescapeJsonString(text: string): string {
  return text.replace(
    /\\(["\\\/nrtbf]|u[0-9a-fA-F]{4})/g,
    (_, seq: string) => {
      switch (seq[0]) {
        case '"': return '"';
        case '\\': return '\\';
        case '/': return '/';
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        case 'u': return String.fromCharCode(parseInt(seq.substring(1), 16));
        default: return seq;
      }
    }
  );
}

/**
 * Replace raw newlines that appear inside JSON string literals
 * with escaped \n so JSON.parse can accept pretty-printed strings.
 */
function escapeNewlinesInJsonStrings(text: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    if (inString && (char === "\n" || char === "\r")) {
      result += "\\n";
      continue;
    }

    result += char;
  }

  return result;
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

  // Step 0: Strip BOM, zero-width characters, and other invisible prefixes
  text = text.replace(/^\uFEFF/, ""); // UTF-8 BOM
  text = text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ""); // zero-width chars

  // Step 1: Strip markdown fences if present
  text = stripMarkdownBlocks(text);

  // Step 2: Try to extract JSON from any surrounding text
  text = extractJsonFromText(text);

  // Step 3: Try direct parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (firstError) {
    // Step 3a: Try escaping raw newlines that may appear inside string values
    try {
      const newlineEscaped = escapeNewlinesInJsonStrings(text);
      parsed = JSON.parse(newlineEscaped);
    } catch {
      /* fallback to next attempts */
    }

    if (parsed !== undefined) {
      // Successfully parsed after newline escaping
    } else {
    // Step 4: Try unescaping double-escaped JSON string content
    // The text may be the inner content of a JSON string (with \n, \", \\\", etc.)

    // Step 4a: Try JSON.parse with wrapping quotes - handles all JSON escapes correctly
    try {
      const unescaped = JSON.parse('"' + text + '"');
      const extracted = extractJsonFromText(unescaped);
      parsed = JSON.parse(extracted);
    } catch {
      /* fall through to manual unescape */
    }

    if (parsed === undefined) {
    // Step 4b: Single-pass unescape that correctly handles \\ before \" and other sequences
    try {
      const unescaped = unescapeJsonString(text);

      const extracted = extractJsonFromText(unescaped);
      parsed = JSON.parse(extracted);
    } catch {
      // Log the problematic output for debugging
      const hexPrefix = Array.from(text.substring(0, 20))
        .map((c) => `0x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(" ");
      console.error(
        "[gemini-parser] Failed to parse output. First 20 byte codes:",
        hexPrefix
      );
      console.error(
        "[gemini-parser] First 500 chars:",
        text.substring(0, 500)
      );
      throw firstError;
    }
    }
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
          const unescaped = unescapeJsonString(innerCleaned);
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
