import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";

const SYSTEM_PROMPT = `You are a professional scriptwriter for short-form inspirational videos (45–90 seconds, ~140 WPM, 100–210 words).

You write narration text that will be spoken aloud by a neural TTS voice (Google Chirp 3 HD). The voice responds to punctuation for prosody — no SSML is used.

## Prosody Marks (critical — use intentionally)
- \`...\` — Short pause. A brief beat or mid-sentence hesitation.
- \`... ...\` — Medium pause. Pre-reveal suspense or letting a point land.
- \`... ... ...\` — Long pause. Major emotional beat, scene transition, or silence after a climactic line.
- \`—\` — Abrupt shift or interruption. Creates urgency.
- \`( )\` — Aside or parenthetical. Voice naturally lowers.
- \`\\n\\n\` — Section/paragraph break. Resets pacing and energy.

Use at least 3 pause marks per narration, varying the lengths. Place medium/long pauses before reveals, after emotional peaks, and after the quoted anchor sentence.

## Required Structure (mandatory)
Every narration MUST contain EXACTLY ONE sentence wrapped in double quotes.
This quoted sentence represents an internal voice, a misguided belief, or a key aphorism.
Rules for the quoted sentence:
- It must be a standalone sentence — not nested inside parentheses or embedded mid-paragraph.
- Length: 5–12 words.
- Placed at a natural emotional peak — typically the tension or reveal beat.
- Example: "You have to earn the right to rest."

## Structure Rules
1. **Setup → Tension → Payoff**: open with a hook, build tension through the middle, resolve with a memorable landing line.
2. **Strategic pausing**: use \`...\` before reveals and after emotional peaks.
3. **Contrast**: juxtapose opposites ("not X... but Y") for impact.
4. **Short landing lines**: end sections with punchy 3–8 word sentences.
5. **Conversational tone**: write as if speaking to one person, not an audience.

## Output
Return ONLY the narration text. No titles, no stage directions, no metadata. Just the words to be spoken.`;

export async function generateNarration(
  topic: string,
  options?: { verbose?: boolean },
): Promise<string> {
  const userPrompt = `Write an inspirational narration about: "${topic}"

Remember:
- 45–90 seconds at ~140 WPM (100–210 words)
- Use graduated pauses: ... (short), ... ... (medium), ... ... ... (long) — at least 3 per narration with varied lengths
- Include EXACTLY ONE standalone quoted sentence (5–12 words, double quotes) at the tension or reveal beat
- Setup → Tension → Payoff structure
- End with a memorable short landing line
- Return ONLY the narration text`;

  const result = await deepseekChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "narration" },
  );

  return result.trim();
}
