import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";

import { storyflowPrisma } from "./prisma";
import { buildTimeline } from "./timeline-builder";
import { RenderQuality } from "./types";

const QUALITY_PRESETS: Record<RenderQuality, { crf: number; preset?: string; codec: string; audioBitrate: string }> = {
  DRAFT: { crf: 28, preset: "veryfast", codec: "h264", audioBitrate: "128k" },
  MEDIUM: { crf: 23, preset: "fast", codec: "h264", audioBitrate: "160k" },
  HIGH: { crf: 20, preset: "medium", codec: "h264", audioBitrate: "192k" },
  PRODUCTION: { crf: 18, preset: "slow", codec: "h265", audioBitrate: "256k" },
};

export async function startRenderJob(projectId: string, quality: RenderQuality = "DRAFT") {
  const project = await storyflowPrisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });

  if (project.status !== "RENDER_READY" && project.status !== "COMPLETED") {
    throw Object.assign(new Error("Project is not render-ready"), { status: 400 });
  }

  // sequential queue: only one active render
  const inFlight = await storyflowPrisma.render.findFirst({ where: { status: "PROCESSING" } });
  if (inFlight) {
    throw Object.assign(new Error("Another render is already in progress"), { status: 429 });
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

export async function getRenderStatus(renderId: string) {
  const render = await storyflowPrisma.render.findUnique({ where: { id: renderId } });
  if (!render) throw Object.assign(new Error("Render not found"), { status: 404 });
  return render;
}

async function runRenderWorker(projectId: string, renderId: string, quality: RenderQuality) {
  const preset = QUALITY_PRESETS[quality];
  const outputDir = path.join(process.cwd(), "public", "projects", projectId, "renders");
  const outputPath = path.join(outputDir, `${renderId}.mp4`);

  const timeline = await buildTimeline(projectId);
  await mkdir(outputDir, { recursive: true });

  // Persist timeline for Remotion staticFile resolution
  const timelinePath = path.join(process.cwd(), "public", "projects", projectId, "timeline.json");
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
      outputPath: path.relative(path.join(process.cwd(), "public"), outputPath),
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
