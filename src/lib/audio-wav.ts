export interface WordTiming {
  word: string;
  startSeconds: number;
  endSeconds: number;
}

export interface TtsResult {
  audioBuffer: Buffer;
  wordTimings: WordTiming[];
  durationSeconds: number;
}

const CHANNELS = 1;
const BITS = 16;

export function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * CHANNELS * (BITS / 8), 28);
  header.writeUInt16LE(CHANNELS * (BITS / 8), 32);
  header.writeUInt16LE(BITS, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}
