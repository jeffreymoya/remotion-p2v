// POC: Google Chirp 3 HD TTS → WAV → Google STT word timestamps → sentence groups
// Run: npx tsx scripts/google-tts-poc.ts
// Then: npm run studio  (look for "POC/google-tts-sync" composition)

import * as fs from "fs";
process.loadEnvFile();

const TEXT =
  "Is this the future of work? Nobody knows — but the signs are everywhere. " +
  "Three hours per day: that's how long the average worker sits in meetings. " +
  "Most could have been an email, a Slack message, or nothing at all! " +
  "Productivity, engagement, retention... all quietly eroding. " +
  "Yet companies keep scheduling them; because busyness signals effort. " +
  "The result is a workforce that feels exhausted — but accomplishes very little.";

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS = 16;
const FPS = 30;

// ── helpers ──────────────────────────────────────────────────────────────────

function pcmToWav(pcm: Buffer): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS / 8), 28);
  header.writeUInt16LE(CHANNELS * (BITS / 8), 32);
  header.writeUInt16LE(BITS, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

function parseDuration(s: string): number {
  return parseFloat(s.replace("s", ""));
}

function stripPunct(w: string): string {
  return w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

type WordTiming = { word: string; startSeconds: number; endSeconds: number };
type Sentence = { text: string; words: WordTiming[]; startSeconds: number; endSeconds: number };

// Split original text into sentences, then match each token to the nearest STT word.
// STT skips punctuation tokens (—, ...) so we skip unmatched tokens silently.
function buildSentences(text: string, sttWords: WordTiming[]): Sentence[] {
  const rawSentences = (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
  const sentences: Sentence[] = [];
  let sttIdx = 0;

  for (const sentenceText of rawSentences) {
    const tokens = sentenceText.split(/\s+/).filter(Boolean);
    const matched: WordTiming[] = [];

    for (const token of tokens) {
      const stripped = stripPunct(token);
      if (!stripped) continue; // pure punctuation token — skip

      // look ahead up to 3 positions to absorb any STT skips
      for (let ahead = 0; ahead < 3 && sttIdx + ahead < sttWords.length; ahead++) {
        if (stripPunct(sttWords[sttIdx + ahead].word) === stripped) {
          sttIdx += ahead;
          matched.push({ ...sttWords[sttIdx], word: token }); // keep original token (with punctuation)
          sttIdx++;
          break;
        }
      }
    }

    if (matched.length === 0) continue;
    sentences.push({
      text: sentenceText,
      words: matched,
      startSeconds: matched[0].startSeconds,
      endSeconds: matched[matched.length - 1].endSeconds,
    });
  }

  return sentences;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_CLOUD_API_KEY not set in .env");

  // ── Step 1: TTS ──────────────────────────────────────────────────────────
  console.log("Step 1: Google TTS Chirp 3 HD...");
  const ttsRes = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: TEXT },
        voice: { languageCode: "en-US", name: "en-US-Chirp3-HD-Aoede" },
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: SAMPLE_RATE },
      }),
    },
  );
  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    throw new Error(`TTS error (${ttsRes.status}): ${err.slice(0, 500)}`);
  }
  const { audioContent } = (await ttsRes.json()) as { audioContent: string };
  const pcm = Buffer.from(audioContent, "base64");
  const wav = pcmToWav(pcm);
  const durationSeconds = pcm.length / (SAMPLE_RATE * CHANNELS * (BITS / 8));
  const durationInFrames = Math.ceil(durationSeconds * FPS);
  fs.mkdirSync("public/audio", { recursive: true });
  fs.writeFileSync("public/audio/google-tts-poc.wav", wav);
  console.log(`  Duration: ${durationSeconds.toFixed(2)}s (${durationInFrames} frames)`);

  // ── Step 2: STT word timestamps ──────────────────────────────────────────
  console.log("Step 2: Google STT word timestamps...");
  const sttRes = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: SAMPLE_RATE,
          languageCode: "en-US",
          enableWordTimeOffsets: true,
        },
        audio: { content: audioContent },
      }),
    },
  );
  if (!sttRes.ok) {
    const err = await sttRes.text();
    throw new Error(`STT error (${sttRes.status}): ${err.slice(0, 500)}`);
  }

  type SttWord = { word: string; startTime: string; endTime: string };
  type SttResponse = { results: Array<{ alternatives: Array<{ words: SttWord[] }> }> };
  const sttData = (await sttRes.json()) as SttResponse;

  const allWords: WordTiming[] = [];
  for (const result of sttData.results ?? []) {
    for (const word of result.alternatives[0]?.words ?? []) {
      allWords.push({
        word: word.word,
        startSeconds: parseDuration(word.startTime ?? "0s"),
        endSeconds: parseDuration(word.endTime ?? "0s"),
      });
    }
  }
  if (allWords.length === 0) throw new Error("STT returned no word timings");
  console.log(`  Got ${allWords.length} word timestamps`);

  // ── Step 3: build sentence groups ────────────────────────────────────────
  const sentences = buildSentences(TEXT, allWords);
  console.log(`  Built ${sentences.length} sentences`);
  sentences.forEach((s, i) =>
    console.log(`  [${i + 1}] "${s.text.slice(0, 50)}..." — ${s.startSeconds.toFixed(2)}s → ${s.endSeconds.toFixed(2)}s (${s.words.length} words)`)
  );

  // ── Step 4: write generated data ─────────────────────────────────────────
  const tsContent = `// AUTO-GENERATED by scripts/google-tts-poc.ts — do not edit by hand
export const POC_DURATION_IN_FRAMES = ${durationInFrames};
export const POC_SENTENCES: Array<{
  text: string;
  startSeconds: number;
  endSeconds: number;
  words: Array<{ word: string; startSeconds: number; endSeconds: number }>;
}> = ${JSON.stringify(sentences, null, 2)};
`;
  fs.writeFileSync("src/poc-tts-data.ts", tsContent);
  console.log("Done. Open Remotion Studio → POC > google-tts-sync");
}

main().catch((e) => { console.error(e); process.exit(1); });
