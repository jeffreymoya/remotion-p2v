import { describe, expect, it } from "vitest";

import { musicVolumeAtFrame } from "@/remotion/lib/music-ducking";
import { AudioElement, MusicElement } from "@/src/lib/storyflow/timeline-types";

const baseMusic: MusicElement = {
  url: "/music.mp3",
  volume: 0.3,
  ducking: {
    reduction: 0.4,
    attackFrames: 10,
    releaseFrames: 14,
    floorVolume: 0.1,
    enabled: true,
  },
};

const narration: AudioElement[] = [
  {
    audioUrl: "/narration.mp3",
    startFrame: 30,
    endFrame: 60,
  },
];

describe("musicVolumeAtFrame", () => {
  it("stays at base before narration", () => {
    expect(musicVolumeAtFrame(0, baseMusic, narration)).toBe(baseMusic.volume);
  });

  it("ramps down during attack", () => {
    const volume = musicVolumeAtFrame(25, baseMusic, narration);
    expect(volume).toBeLessThan(baseMusic.volume);
    expect(volume).toBeGreaterThan(baseMusic.volume * 0.55);
  });

  it("ducks during narration body", () => {
    const volume = musicVolumeAtFrame(35, baseMusic, narration);
    expect(volume).toBeCloseTo(baseMusic.volume * 0.6);
  });

  it("ramps up during release", () => {
    const volume = musicVolumeAtFrame(68, baseMusic, narration);
    expect(volume).toBeGreaterThan(baseMusic.volume * 0.6);
    expect(volume).toBeLessThan(baseMusic.volume);
  });

  it("returns to base after release", () => {
    expect(musicVolumeAtFrame(80, baseMusic, narration)).toBe(baseMusic.volume);
  });
});
