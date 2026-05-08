import assert from "node:assert/strict";
import {
  parseSceneManifest,
  validateSceneManifest,
  deriveSceneSlug,
  compositionId,
  sceneFileName,
  sceneImageDir,
  manifestPath,
  sceneOutputDir,
  padSceneIndex,
} from "../src/lib/scene-manifest";

const validManifest = {
  segmentTitle: "The Secret Rise of Quiet Vacationing",
  segmentSlug: "the-secret-rise-of-quiet-vacationing-0-00-0-30",
  segmentStartSeconds: 0,
  segmentEndSeconds: 30,
  scenes: [
    {
      sceneIndex: 1,
      sceneSlug: "quiet-quitting-hook",
      title: "Quiet Quitting Hook",
      startSeconds: 0,
      endSeconds: 5,
      narrative: "You've heard of Quiet Quitting...",
      visualGoal: "Contradiction hook showing stark visual contrast.",
    },
    {
      sceneIndex: 2,
      sceneSlug: "what-is-quiet-vacationing",
      title: "What is Quiet Vacationing",
      startSeconds: 5,
      endSeconds: 18,
      narrative: "So what exactly is Quiet Vacationing?",
      visualGoal: "Explain the concept using beach imagery and Slack overlay.",
    },
    {
      sceneIndex: 3,
      sceneSlug: "viewer-promise",
      title: "Viewer Promise",
      startSeconds: 18,
      endSeconds: 30,
      narrative: "By the end you'll understand...",
      visualGoal: "Promise card with bullet points.",
      ttsText: "By the end, you'll understand the hidden truth behind this trend.",
      estimatedDurationSeconds: 12,
    },
  ],
};

async function main(): Promise<void> {
  // ── valid manifest ──
  {
    const result = validateSceneManifest(validManifest);
    assert.equal(result.scenes.length, 3);
    assert.equal(result.scenes[0].sceneSlug, "quiet-quitting-hook");
    assert.equal(result.scenes[2].ttsText, "By the end, you'll understand the hidden truth behind this trend.");
    assert.equal(result.scenes[2].estimatedDurationSeconds, 12);
    console.log("  PASS: valid manifest");
  }

  // ── empty scenes array ──
  {
    assert.throws(
      () => validateSceneManifest({ ...validManifest, scenes: [] }),
      /non-empty scenes/,
    );
    console.log("  PASS: empty scenes rejection");
  }

  // ── overlapping scenes ──
  {
    const overlapping = {
      ...validManifest,
      scenes: [
        { ...validManifest.scenes[0], sceneIndex: 1, startSeconds: 0, endSeconds: 10 },
        { ...validManifest.scenes[1], sceneIndex: 2, startSeconds: 5, endSeconds: 18 },
      ],
    };
    assert.throws(
      () => validateSceneManifest(overlapping),
      /overlaps/,
    );
    console.log("  PASS: overlapping scenes rejection");
  }

  // ── scene outside segment range ──
  {
    const outOfRange = {
      ...validManifest,
      scenes: [
        { ...validManifest.scenes[0], sceneIndex: 1, startSeconds: 0, endSeconds: 35 },
      ],
    };
    assert.throws(
      () => validateSceneManifest(outOfRange),
      /within segment range/,
    );
    console.log("  PASS: out-of-range rejection");
  }

  // ── missing narrative ──
  {
    const missingNarrative = {
      ...validManifest,
      scenes: [
        { ...validManifest.scenes[0], sceneIndex: 1, narrative: "" },
      ],
    };
    assert.throws(
      () => validateSceneManifest(missingNarrative),
      /non-empty narrative/,
    );
    console.log("  PASS: missing narrative rejection");
  }

  // ── invalid segment timings ──
  {
    assert.throws(
      () =>
        validateSceneManifest({
          ...validManifest,
          segmentEndSeconds: 0,
        }),
      /greater than segmentStartSeconds/,
    );
    console.log("  PASS: invalid segment timing rejection");
  }

  // ── parse manifest from JSON string ──
  {
    const json = JSON.stringify(validManifest);
    const result = parseSceneManifest(json);
    assert.equal(result.scenes.length, 3);
    console.log("  PASS: parse from JSON string");
  }

  // ── parse manifest with markdown wrapper ──
  {
    const wrapped = `Here is the scene plan:\n\n${JSON.stringify(validManifest)}\n\nDone.`;
    const result = parseSceneManifest(wrapped);
    assert.equal(result.scenes.length, 3);
    console.log("  PASS: parse from markdown-wrapped response");
  }

  // ── auto-derive sceneSlug ──
  {
    const noSlug = {
      ...validManifest,
      scenes: [
        { ...validManifest.scenes[0], sceneSlug: "" },
      ],
    };
    const result = validateSceneManifest(noSlug);
    assert.equal(result.scenes[0].sceneSlug, deriveSceneSlug(result.scenes[0].title));
    console.log("  PASS: auto-derived sceneSlug");
  }

  // ── helper functions ──
  const scene = validManifest.scenes[0];
  const slug = validManifest.segmentSlug;

  assert.equal(compositionId(slug, scene), `${slug}-scene-001`);
  assert.equal(sceneFileName(scene, ".txt"), "scene-001-quiet-quitting-hook.txt");
  assert.equal(
    sceneFileName(scene, "-images.json"),
    "scene-001-quiet-quitting-hook-images.json",
  );
  assert.equal(
    sceneFileName(scene, "-scene.json"),
    "scene-001-quiet-quitting-hook-scene.json",
  );
  assert.equal(sceneImageDir(slug, scene), "public/images/the-secret-rise-of-quiet-vacationing-0-00-0-30/quiet-quitting-hook");
  assert.equal(manifestPath(slug), "prompts/the-secret-rise-of-quiet-vacationing-0-00-0-30-scenes.json");
  assert.equal(sceneOutputDir(slug), "prompts/the-secret-rise-of-quiet-vacationing-0-00-0-30");
  assert.equal(padSceneIndex(1), "001");
  assert.equal(padSceneIndex(12), "012");
  assert.equal(deriveSceneSlug("Hello World!"), "hello-world");
  console.log("  PASS: helper functions");

  console.log("\nScene manifest smoke passed: 10 cases");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
