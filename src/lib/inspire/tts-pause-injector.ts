/**
 * Inject pause signals into narration text for Google TTS (Chirp 3 HD).
 *
 * Chirp 3 HD does NOT support SSML `<break>` but honors text-level cues:
 *   - em-dash (`—`) → short dramatic pause
 *   - ellipsis (`...`) → slight pause
 *   - stacked ellipsis (`... ...`, `... ... ...`) → longer pauses
 *
 * This transform is applied ONLY to the TTS input string; the original
 * narration flowing into the sentence segmenter / kinetic text is unchanged.
 */

/**
 * Convert narration text into a TTS-friendly form with generous pauses.
 *
 * | Source pattern        | Becomes            | Intended pause |
 * |-----------------------|--------------------|----------------|
 * | `\n\n` (paragraph)    | ` ... ... ... `    | Long (~2s)     |
 * | `\n` (single newline) | ` `                | None           |
 * | standalone `...`      | `... ...`          | Medium         |
 * | `—` (em-dash)         | `— ...`            | Medium         |
 * | existing `... ...`    | kept               | Medium         |
 * | existing `... ... ...`| kept               | Long           |
 */
export function injectPausesForGoogle(narration: string): string {
  return (
    narration
      // paragraph break → long pause
      .replace(/\n\n+/g, " ... ... ... ")
      // single newline → space
      .replace(/\n/g, " ")
      // standalone ... → medium pause (skip ... already in a chain)
      .replace(/(?<!\.\.\. )\.\.\.(?! \.\.\.)/g, "... ...")
      // em-dash → add trailing ellipsis beat
      .replace(/—/g, "— ...")
  );
}
