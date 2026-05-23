// Code generator for docu-scripts.ts.
//
// Extracted from scripts/tts-docu.ts. Takes a built DocuScript[] and
// writes the auto-generated file that Root.tsx imports.

import fs from "node:fs";
import type { DocuScript } from "../../components/docu/DocumentaryComposition";

const SCRIPTS_PATH = "src/generated/docu-scripts.ts";

function sent(
  idx: number,
  text: string,
  startFrame: number,
  endFrame: number,
  clipIndex: number,
  tokenWordIndexes: number[],
  emphasisWordIndexes?: number[],
): string {
  const emph = emphasisWordIndexes && emphasisWordIndexes.length > 0
    ? `[${emphasisWordIndexes.join(", ")}]`
    : "undefined";
  const twi = JSON.stringify(tokenWordIndexes);
  return `sent(${idx}, ${JSON.stringify(text)}, ${startFrame}, ${endFrame}, ${clipIndex}, ${twi}, ${emph})`;
}

function shot(index: number, startFrame: number, endFrame: number, palette: string): string {
  return `shot(${index}, ${startFrame}, ${endFrame}, "${palette}")`;
}

function buildOverlayCode(o: DocuScript["overlays"][number]): string {
  const parts: string[] = [`type: "${o.type}"`, `text: ${JSON.stringify(o.text)}`];
  if (o.value !== undefined) parts.push(`value: ${o.value}`);
  if (o.unit !== undefined) parts.push(`unit: "${o.unit}"`);
  if (o.source !== undefined) parts.push(`source: ${JSON.stringify(o.source)}`);
  parts.push(`palette: "${o.palette}"`, `startFrame: ${o.startFrame}`, `endFrame: ${o.endFrame}`);
  return `{ ${parts.join(", ")} }`;
}

export function generateDocuScriptsFile(scripts: DocuScript[]): void {
  const contents: string[] = [];

  for (const script of scripts) {
    const fps = script.fps;

    const wordTimingsJson = JSON.stringify(
      script.wordTimings.map((w) => ({
        word: w.word,
        startSeconds: Number(w.startSeconds.toFixed(3)),
        endSeconds: Number(w.endSeconds.toFixed(3)),
      })),
      null,
      2,
    )
      .split("\n")
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join("\n");

    const sentencesCode = script.sentences
      .map((se, i) =>
        sent(
          se.sentenceIndex,
          se.text,
          se.startFrame,
          se.endFrame,
          se.clipIndex,
          se.tokenWordIndexes,
          se.emphasisWordIndexes,
        ),
      )
      .join(",\n      ");

    const shotsCode = script.clips
      .flatMap((c) => c.shots)
      .map((sh, i) => shot(i, sh.startFrame, sh.endFrame, sh.palette))
      .join(",\n          ");

    const overlaysCode = script.overlays
      .map((o) => buildOverlayCode(o))
      .join(",\n      ");

    contents.push(`import type { DocuScript } from "../components/docu/DocumentaryComposition";

const IMG_ROOT = "images/docu/${script.slug}";

const WORD_TIMINGS = ${wordTimingsJson};

const DURATION_FRAMES = ${script.durationInFrames};

function sent(
  idx: number,
  text: string,
  startFrame: number,
  endFrame: number,
  clipIndex: number,
  tokenWordIndexes: number[],
  emphasisWordIndexes?: number[],
) {
  return {
    sentenceIndex: idx,
    text,
    startSeconds: startFrame / ${fps},
    endSeconds: endFrame / ${fps},
    startFrame,
    endFrame,
    clipIndex,
    tokenWordIndexes,
    emphasisWordIndexes,
  };
}

function shot(
  index: number,
  startFrame: number,
  endFrame: number,
  palette: "cool-tech" | "warm-real",
) {
  return {
    imagePath: \`\${IMG_ROOT}/img-\${String(index).padStart(2, "0")}.jpg\`,
    mediaType: "image" as const,
    loop: false,
    startFrame,
    endFrame,
    palette,
  };
}

export const docuScripts: DocuScript[] = [
  {
    slug: ${JSON.stringify(script.slug)},
    topic: ${JSON.stringify(script.topic)},
    audioPath: "${script.audioPath || `audio/docu/${script.slug}.wav`}",
    backgroundMusicPath:
      ${JSON.stringify(script.backgroundMusicPath || "background-music/scott-buckley-permafrost(chosic.com).mp3")},
    durationInFrames: DURATION_FRAMES,
    fps: ${fps},
    width: ${script.width},
    height: ${script.height},
    wordTimings: WORD_TIMINGS,
    sentences: [
      ${sentencesCode},
    ],
    clips: [
      {
        clipIndex: 0,
        startFrame: 0,
        endFrame: DURATION_FRAMES,
        shots: [
          ${shotsCode},
        ],
      },
    ],
    overlays: [
      ${overlaysCode},
    ],
    articleCards: ${JSON.stringify(script.articleCards ?? [], null, 2)},
  },
];
`);
  }

  const fileContent = contents.join("\n");

  fs.writeFileSync(SCRIPTS_PATH, fileContent);
  console.log(`[docu:codegen] Wrote ${SCRIPTS_PATH}`);
}
