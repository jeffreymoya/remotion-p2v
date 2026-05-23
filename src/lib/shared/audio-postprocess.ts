import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// EQ chain for warm, chest-resonant elder voice. No echo/chorus (breaks caption sync).
// pitch is duration-preserving so word-timing alignment is safe.
// reverb args: reverberance HF-damping room-scale stereo-depth pre-delay wet-gain
const SOX_EFFECTS = [
  "norm", "-2",
  "pitch", "-50",          // ~1 semitone down; subtle depth without formant smear
  "bass", "+4", "200",      // chest weight at 200 Hz
  "equalizer", "350", "1.0q", "+3",   // low-mid body / chest resonance
  "equalizer", "3500", "1.0q", "-3",  // tame nasal/harsh band
  "treble", "-5",           // warmth, reduce sibilance
  "reverb", "6", "75", "20", "40", "5", "-8",   // very subtle, dark, dry room
];

export function checkSox(): void {
  const result = spawnSync("sox", ["--version"], { encoding: "utf-8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      "SoX not found. Install with: sudo apt install sox  (Ubuntu/Debian) or brew install sox (macOS)",
    );
  }
}

export function dreamyVoice(wavBuffer: Buffer, slug: string): Buffer {
  const tmpIn = path.join(os.tmpdir(), `${slug}-sox-in.wav`);
  const tmpOut = path.join(os.tmpdir(), `${slug}-sox-out.wav`);

  try {
    fs.writeFileSync(tmpIn, wavBuffer);

    const result = spawnSync("sox", [tmpIn, tmpOut, ...SOX_EFFECTS], {
      encoding: "utf-8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`SoX failed (exit ${result.status}): ${result.stderr}`);
    }

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

// Lighter postprocess for voices that are already aged (e.g. ElevenLabs old man).
// Only normalizes and adds subtle reverb — no pitch shift or EQ.
const SOX_REVERB_ONLY = [
  "norm", "-2",
  "reverb", "6", "75", "20", "40", "5", "-8",
];

export function reverbOnlyVoice(wavBuffer: Buffer, slug: string): Buffer {
  const tmpIn = path.join(os.tmpdir(), `${slug}-sox-in.wav`);
  const tmpOut = path.join(os.tmpdir(), `${slug}-sox-out.wav`);

  try {
    fs.writeFileSync(tmpIn, wavBuffer);

    const result = spawnSync("sox", [tmpIn, tmpOut, ...SOX_REVERB_ONLY], {
      encoding: "utf-8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`SoX failed (exit ${result.status}): ${result.stderr}`);
    }

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}

// Broadcast voice: presence-boosted, dry, compressed — no warmth/reverb
export function commandingVoice(wavBuffer: Buffer, slug: string): Buffer {
  const tmpIn = path.join(os.tmpdir(), `${slug}-sox-in.wav`);
  const tmpOut = path.join(os.tmpdir(), `${slug}-sox-out.wav`);

  try {
    fs.writeFileSync(tmpIn, wavBuffer);

    const soxArgs = [
      "norm", "-1",
      "highpass", "80",
      "equalizer", "120", "1.0q", "+2",
      "equalizer", "3000", "1.5q", "+3",
      "equalizer", "6500", "1.5q", "-2",
      "compand", "0.02,0.20", "6:-70,-60,-20", "-5", "-90", "0.1",
      "norm", "-3",
    ];

    const result = spawnSync("sox", [tmpIn, tmpOut, ...soxArgs], {
      encoding: "utf-8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`SoX failed (exit ${result.status}): ${result.stderr}`);
    }

    return fs.readFileSync(tmpOut);
  } finally {
    if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }
}
