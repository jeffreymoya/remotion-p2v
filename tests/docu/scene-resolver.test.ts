/**
 * Usage:
 *   tsx tests/docu/scene-resolver.test.ts
 */
import { strict as assert } from "node:assert";
import { resolveScenePlan } from "../../src/lib/docu/scene-resolver";
import { zCompositionPlan, type ScenePlan, type WordTiming } from "../../src/lib/pipeline/schemas";
import type { SentenceDef } from "../../src/lib/docu/tts-pipeline";
import type { DocuSegmentPlan } from "../../src/lib/docu/segment-types";

const sentences: SentenceDef[] = [
  { text: "The Fed moves money.", emphasis: ["Fed"], palette: "cool-tech" },
  { text: "Rates reshape household budgets.", emphasis: ["Rates"], palette: "cool-tech" },
  { text: "Borrowers feel the squeeze.", emphasis: ["Borrowers"], palette: "warm-real" },
  { text: "Markets watch every signal.", emphasis: ["Markets"], palette: "cool-tech" },
];

const wordTimings: WordTiming[] = sentences
  .flatMap((sentence) => sentence.text.split(/\s+/))
  .map((word, index) => ({
    word,
    startSeconds: index * 0.35,
    endSeconds: index * 0.35 + 0.25,
  }));

const scenePlan: ScenePlan = {
  scenes: [
    {
      id: "scene-0",
      role: "hook",
      focalOwner: "title",
      background: { assetRef: "" },
      layers: [{
        component: "TitleCard",
        layerRole: "primary",
        props: { line1: "The Fed", line2: "Moves Money" },
        anchors: [{ target: "enter", at: { kind: "sceneStart" } }],
      }],
      emphasisWordRefs: [],
      evidenceRefs: [],
    },
    {
      id: "scene-1",
      role: "data",
      focalOwner: "metric",
      background: { assetRef: "" },
      layers: [{
        component: "KineticNumber",
        layerRole: "primary",
        props: { label: "Rates", value: 5, unit: "%" },
        anchors: [{ target: "enter", at: { kind: "word", text: "Markets" } }],
      }],
      emphasisWordRefs: [],
      evidenceRefs: [],
    },
  ],
};

const segmentPlans: DocuSegmentPlan[] = [
  { index: 0, title: "Hook", intent: "Open", targetSentenceCount: 2, assignedAnchorIds: [] },
  { index: 1, title: "Data", intent: "Explain", targetSentenceCount: 2, assignedAnchorIds: [] },
];

const plan = resolveScenePlan({
  scenePlan,
  sentences,
  wordTimings,
  fps: 30,
  width: 1920,
  height: 1080,
  audioPath: "audio/docu/test.wav",
  durationInFrames: 180,
  captionsEnabled: true,
  segmentPlans,
});

assert.doesNotThrow(() => zCompositionPlan.parse(plan), "composition plan parses");
assert.equal(plan.captionsEnabled, true, "captionsEnabled passthrough");
assert.equal(plan.scenes.every((scene) => scene.layers.filter((layer) => layer.layerRole === "primary").length === 1), true, "one primary per scene");
assert.equal(plan.scenes[0].fromFrame <= plan.scenes[1].fromFrame, true, "fromFrame monotonic non-decreasing");

console.log("PASS scene resolver");
