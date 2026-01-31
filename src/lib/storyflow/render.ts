import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

import { ApiError, NotFoundError } from "@/app/api/lib";
import { storyflowPrisma } from "./prisma";
import { buildTimeline } from "./timeline-builder";
import { RenderQuality } from "./types";
import { getProjectPaths, getPublicDir } from "@/src/lib/paths";
import { runStage } from "@/src/lib/storyflow/pipeline/runner";
import type { PipelineStage, PipelineStageOptions } from "@/src/lib/storyflow/pipeline/types";
import type { Render } from "@/src/lib/storyflow/types";

const QUALITY_PRESETS: Record<RenderQuality, { crf: number; preset?: string; codec: string; audioBitrate: string }> = {
  DRAFT: { crf: 28, preset: "veryfast", codec: "h264", audioBitrate: "128k" },
  MEDIUM: { crf: 23, preset: "fast", codec: "h264", audioBitrate: "160k" },
  HIGH: { crf: 20, preset: "medium", codec: "h264", audioBitrate: "192k" },
  PRODUCTION: { crf: 18, preset: "slow", codec: "h265", audioBitrate: "256k" },
};

type RenderStageOptions = PipelineStageOptions & { quality?: RenderQuality };
type RenderStageInput = { projectId: string };

async function createRenderJob(projectId: string, quality: RenderQuality = "DRAFT") {
  const inFlight = await storyflowPrisma.render.findFirst({ where: { status: "PROCESSING" } });
  if (inFlight) {
    throw new ApiError("Another render is already in progress", 429, "RENDER_IN_PROGRESS");
  }

  const render = await storyflowPrisma.render.create({
    data: {
      projectId,
      quality,
      status: "PROCESSING",
      progress: 0,
      startedAt: new Date(),
    },
  });

  await storyflowPrisma.project.update({
    where: { id: projectId },
    data: { status: "RENDERING" },
  });

  // Kick off async worker (fire and forget)
  runRenderWorker(projectId, render.id, quality).catch(async (err) => {
    await storyflowPrisma.render.update({
      where: { id: render.id },
      data: { status: "FAILED", error: err?.message ?? "Render failed", completedAt: new Date() },
    });
    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { status: "ERROR" },
    });
  });

  return render;
}

export async function startRenderJob(projectId: string, quality: RenderQuality = "DRAFT") {
  return runStage(renderStage, projectId, { quality });
}

export async function getRenderStatus(renderId: string) {
  const render = await storyflowPrisma.render.findUnique({ where: { id: renderId } });
  if (!render) throw new NotFoundError("Render", renderId);
  return render;
}

async function runRenderWorker(projectId: string, renderId: string, quality: RenderQuality) {
  const preset = QUALITY_PRESETS[quality];
  const paths = getProjectPaths(projectId);
  const outputDir = paths.renders;
  const outputPath = path.join(outputDir, `${renderId}.mp4`);

  const timeline = await buildTimeline(projectId);
  await mkdir(outputDir, { recursive: true });

  // Persist timeline for Remotion staticFile resolution
  const timelinePath = paths.timeline;
  await writeFile(timelinePath, JSON.stringify(timeline, null, 2));

  await updateProgress(renderId, 0.02);

  const args = [
    "remotion",
    "render",
    projectId, // composition id (from src/Root.tsx dynamic compositions)
    outputPath,
    "--codec",
    preset.codec,
    "--audio-codec",
    "aac",
    "--audio-bitrate",
    preset.audioBitrate,
  ];

  if (preset.codec === "h264" || preset.codec === "h265") {
    args.push("--crf", String(preset.crf));
  } else if (preset.codec === "prores" && preset.preset) {
    args.push("--prores-profile", preset.preset);
  }

  await execRemotion(args, renderId);

  await storyflowPrisma.render.update({
    where: { id: renderId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      progress: 1,
      outputPath: path.relative(getPublicDir(), outputPath),
    },
  });

  await storyflowPrisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED" },
  });
}

async function execRemotion(args: string[], renderId: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", args, { cwd: process.cwd(), env: process.env });

    child.stdout?.on("data", async (data) => {
      const line = data.toString();
      const match = line.match(/(\d+)%/);
      if (match) {
        const progress = Math.min(0.99, Number(match[1]) / 100);
        await updateProgress(renderId, progress);
      }
    });

    child.stderr?.on("data", (data) => {
      console.error("[render]", data.toString());
    });

    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`Remotion exited with code ${code}`));
    });

    child.on("error", (err) => reject(err));
  });
}

async function updateProgress(renderId: string, progress: number) {
  await storyflowPrisma.render.update({
    where: { id: renderId },
    data: { progress, status: "PROCESSING" },
  });
}

export const renderStage = {
  id: "render",
  requiredStatus: "RENDER_READY",
  allowedStatuses: ["RENDER_READY", "COMPLETED"],
  targetStatus: "RENDERING",
  async prepare(projectId: string): Promise<RenderStageInput> {
    return { projectId };
  },
  async execute(input: RenderStageInput, options?: RenderStageOptions): Promise<Render> {
    const quality = options?.quality ?? "DRAFT";
    return createRenderJob(input.projectId, quality);
  },
  async commit(): Promise<void> {
    // No additional commit work; creation already persisted and worker launched.
  },
} satisfies PipelineStage<RenderStageInput, Render, RenderStageOptions>;
