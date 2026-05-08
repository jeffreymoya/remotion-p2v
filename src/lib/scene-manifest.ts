import fs from "node:fs";
import path from "node:path";

export interface SceneSpec {
  sceneIndex: number;
  sceneSlug: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  narrative: string;
  visualGoal: string;
  ttsText?: string;
  estimatedDurationSeconds?: number;
  audioPath?: string;
}

export interface SceneManifest {
  segmentTitle: string;
  segmentSlug: string;
  segmentStartSeconds: number;
  segmentEndSeconds: number;
  scenes: SceneSpec[];
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export function deriveSceneSlug(title: string): string {
  return toSlug(title);
}

export function padSceneIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export function sceneFileName(scene: SceneSpec, suffix: string): string {
  const idx = padSceneIndex(scene.sceneIndex);
  const slug = scene.sceneSlug || deriveSceneSlug(scene.title);
  return `scene-${idx}-${slug}${suffix}`;
}

export function compositionId(segmentSlug: string, scene: SceneSpec): string {
  const idx = padSceneIndex(scene.sceneIndex);
  return `${segmentSlug}-scene-${idx}`;
}

export function manifestPath(segmentSlug: string): string {
  return path.join("prompts", `${segmentSlug}-scenes.json`);
}

export function sceneOutputDir(segmentSlug: string): string {
  return path.join("prompts", segmentSlug);
}

export function sceneImageDir(
  segmentSlug: string,
  scene: SceneSpec,
): string {
  const slug = scene.sceneSlug || deriveSceneSlug(scene.title);
  return path.join("public", "images", segmentSlug, slug);
}

export function validateSceneManifest(data: unknown): SceneManifest {
  if (!data || typeof data !== "object") {
    throw new Error("Scene manifest must be an object");
  }
  const obj = data as Record<string, unknown>;

  if (typeof obj.segmentTitle !== "string" || !obj.segmentTitle.trim()) {
    throw new Error("Scene manifest must have a non-empty segmentTitle");
  }
  if (typeof obj.segmentSlug !== "string" || !obj.segmentSlug.trim()) {
    throw new Error("Scene manifest must have a non-empty segmentSlug");
  }
  if (typeof obj.segmentStartSeconds !== "number" || obj.segmentStartSeconds < 0) {
    throw new Error("Scene manifest must have a valid segmentStartSeconds");
  }
  if (typeof obj.segmentEndSeconds !== "number" || obj.segmentEndSeconds <= (obj.segmentStartSeconds as number)) {
    throw new Error("Scene manifest must have a valid segmentEndSeconds greater than segmentStartSeconds");
  }

  const scenes = obj.scenes;
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error("Scene manifest must have a non-empty scenes array");
  }

  const result: SceneSpec[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i] as Record<string, unknown>;

    if (typeof scene.sceneIndex !== "number" || scene.sceneIndex < 1) {
      throw new Error(`Scene at index ${i}: sceneIndex must be a positive number, got ${scene.sceneIndex}`);
    }
    const sceneSlug = typeof scene.sceneSlug === "string" && scene.sceneSlug.trim()
      ? String(scene.sceneSlug).trim()
      : "";
    const title = typeof scene.title === "string" && scene.title.trim()
      ? String(scene.title).trim()
      : `Scene ${scene.sceneIndex}`;

    if (typeof scene.startSeconds !== "number" || scene.startSeconds < 0) {
      throw new Error(`Scene "${title}": must have a valid startSeconds`);
    }
    if (typeof scene.endSeconds !== "number" || scene.endSeconds <= (scene.startSeconds as number)) {
      throw new Error(`Scene "${title}": must have a valid endSeconds greater than startSeconds`);
    }

    const segStart = obj.segmentStartSeconds as number;
    const segEnd = obj.segmentEndSeconds as number;
    const sStart = scene.startSeconds as number;
    const sEnd = scene.endSeconds as number;
    if (sStart < segStart || sEnd > segEnd) {
      throw new Error(
        `Scene "${title}": timing [${sStart}s-${sEnd}s] must be within segment range [${segStart}s-${segEnd}s]`,
      );
    }

    if (typeof scene.narrative !== "string" || !(scene.narrative as string).trim()) {
      throw new Error(`Scene "${title}": must have a non-empty narrative`);
    }

    result.push({
      sceneIndex: scene.sceneIndex as number,
      sceneSlug: sceneSlug || deriveSceneSlug(title),
      title,
      startSeconds: scene.startSeconds as number,
      endSeconds: scene.endSeconds as number,
      narrative: (scene.narrative as string).trim(),
      visualGoal: typeof scene.visualGoal === "string" ? (scene.visualGoal as string).trim() : "",
      ttsText: typeof scene.ttsText === "string" ? (scene.ttsText as string) : undefined,
      estimatedDurationSeconds: typeof scene.estimatedDurationSeconds === "number"
        ? scene.estimatedDurationSeconds as number
        : undefined,
      audioPath: typeof scene.audioPath === "string" ? (scene.audioPath as string) : undefined,
    });
  }

  // Validate scene ordering (non-overlapping, ascending)
  for (let i = 1; i < result.length; i++) {
    const prev = result[i - 1];
    const curr = result[i];
    if (curr.startSeconds < prev.endSeconds) {
      throw new Error(
        `Scene "${curr.title}" [${curr.startSeconds}s] overlaps with scene "${prev.title}" [${prev.startSeconds}s-${prev.endSeconds}s]`,
      );
    }
  }

  return {
    segmentTitle: obj.segmentTitle as string,
    segmentSlug: obj.segmentSlug as string,
    segmentStartSeconds: obj.segmentStartSeconds as number,
    segmentEndSeconds: obj.segmentEndSeconds as number,
    scenes: result,
  };
}

export function parseSceneManifest(raw: string): SceneManifest {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in scene manifest response");
  }
  const json = trimmed.slice(jsonStart, jsonEnd + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in scene manifest response: ${message}`);
  }
  return validateSceneManifest(parsed);
}

export function writeFileAtomically(filePath: string, content: string): void {
  const tmpPath = filePath + ".tmp";
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function isArtifactReady(filePath: string): boolean {
  if (filePath.endsWith(".tmp")) return false;
  if (!fs.existsSync(filePath)) return false;
  try {
    const stat = fs.statSync(filePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}
