#!/usr/bin/env node
import { test } from "node:test";
import assert from "node:assert/strict";
import { musicVolumeAtFrame } from "../music-ducking";
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

test("music volume stays at base before narration", () => {
  assert.equal(musicVolumeAtFrame(0, baseMusic, narration), baseMusic.volume);
});

test("music ramps down during attack window", () => {
  const volume = musicVolumeAtFrame(25, baseMusic, narration); // 5 frames before start
  assert.ok(volume < baseMusic.volume && volume > baseMusic.volume * 0.55);
});

test("music is ducked during narration body", () => {
  const volume = musicVolumeAtFrame(35, baseMusic, narration);
  assert.equal(volume, baseMusic.volume * 0.6);
});

test("music ramps up during release window", () => {
  const volume = musicVolumeAtFrame(68, baseMusic, narration); // 8 frames after end
  assert.ok(volume > baseMusic.volume * 0.6 && volume < baseMusic.volume);
});

test("music returns to base volume after release", () => {
  const volume = musicVolumeAtFrame(80, baseMusic, narration);
  assert.equal(volume, baseMusic.volume);
});
