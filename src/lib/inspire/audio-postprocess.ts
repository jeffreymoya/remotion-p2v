import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// EQ + light reverb — no echo/chorus to preserve caption sync and intelligibility.
const SOX_EFFECTS = [
  "norm", "-2",
  "treble", "-3",
  "bass", "+1.5",
  "reverb", "35", "30", "60", "80", "20", "0",
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
