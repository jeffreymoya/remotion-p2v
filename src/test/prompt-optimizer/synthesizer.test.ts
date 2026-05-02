import { describe, expect, it } from "vitest";

import { escapeSsmlText } from "@/src/lib/prompt-optimizer/synthesizer";

describe("escapeSsmlText", () => {
  it("escapes XML metacharacters before Google TTS wraps text as SSML", () => {
    expect(escapeSsmlText(`A&B <tag> "quote" 'apostrophe'`)).toBe(
      "A&amp;B &lt;tag&gt; &quot;quote&quot; &apos;apostrophe&apos;"
    );
  });
});
