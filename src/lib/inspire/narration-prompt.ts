import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, CODE_GEN_REASONING } from "../config";

const SYSTEM_PROMPT = `You are a professional scriptwriter for short-form inspirational videos (45–90 seconds, ~140 WPM, 100–210 words).

You write narration text that will be spoken aloud by a neural TTS voice (Google Chirp 3 HD). The voice responds to punctuation for prosody — no SSML is used.

## Prosody Marks (critical — use intentionally)
- \`...\` — Extended pause. Creates dramatic tension or lets a point land.
- \`—\` — Abrupt shift or interruption. Creates urgency.
- \`( )\` — Aside or parenthetical. Voice naturally lowers.
- \`" "\` — Quoted speech. Voice shifts to a "quoting" register.
- \`\\n\\n\` — Section/paragraph break. Resets pacing and energy.

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
- Use prosody marks (..., —, ( ), " ", \\n\\n) strategically
- Setup → Tension → Payoff structure
- End with a memorable short landing line
- Return ONLY the narration text`;

  const result = await deepseekChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    CODE_GEN_REASONING,
    { verbose: options?.verbose },
  );

  return result.trim();
}
