import fs from "node:fs";
import { loadCachedTopicData, topicDataPath } from "../../src/lib/docu/topic-generator";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

const slug = `tmp-topic-cache-${process.pid}`;
const path = topicDataPath(slug);

try {
  fs.mkdirSync("prompts/docu", { recursive: true });
  fs.writeFileSync(
    path,
    JSON.stringify({
      topic: "tmp topic",
      slug,
      generatedAt: "2026-06-14T00:00:00.000Z",
      sentences: [
        {
          text: "A sentence",
          emphasis: ["sentence"],
          palette: "cool-tech",
        },
      ],
      overlaySpecs: [],
      segmentPlans: [
        {
          index: 0,
          title: "Hook",
          arcRole: "hook",
          intent: "Open strong",
          targetSentenceCount: 1,
          assignedAnchorIds: ["anc-001"],
        },
      ],
    }, null, 2),
  );

  const loaded = loadCachedTopicData(slug);
  assert(loaded !== null, "cache: topic data loads");
  assert((loaded?.segmentPlans?.[0] as { arcRole?: string } | undefined)?.arcRole === "hook", "cache: preserves arcRole");
} finally {
  fs.rmSync(path, { force: true });
}

if (passed < 2) throw new Error(`${passed} tests passed - expected 2`);
