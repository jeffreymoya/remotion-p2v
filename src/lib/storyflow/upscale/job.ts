import path from "path";
import { mkdir } from "fs/promises";

import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "@/app/api/lib";
import { getProjectPaths } from "@/src/lib/paths";
import { storyflowPrisma } from "../prisma";
import { extractMetadata } from "../assets";
import { RealESRGANService } from "./realesrgan";
import { toJsonObject } from "../prisma-json";
import { getSettings } from "../settings";

export type ProcessUpscaleJobOptions = {
  force?: boolean;
};

function getMetadataWidth(metadata: unknown): number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return 0;
  }

  const width = (metadata as { width?: unknown }).width;
  return typeof width === "number" && Number.isFinite(width) ? width : 0;
}

function resolveAssetPath(
  projectRoot: string,
  projectId: string,
  publicPath: string,
): string {
  const normalized = publicPath.replace(/\\/g, "/");
  const projectPrefix = `/projects/${projectId}/`;
  if (normalized.startsWith(projectPrefix)) {
    return path.join(projectRoot, normalized.slice(projectPrefix.length));
  }

  return path.join(projectRoot, normalized.replace(/^\/+/, ""));
}

export async function processUpscaleJob(
  assetId: string,
  options: ProcessUpscaleJobOptions = {},
) {
  const asset = await storyflowPrisma.asset.findByIdOrThrow(assetId);
  if (!asset) {
    throw new NotFoundError("Asset", assetId);
  }

  if (asset.type !== "IMAGE") {
    throw new ValidationError("Upscaling is only supported for images");
  }
  if (asset.upscaled) {
    if (asset.upscaleStatus === "done") {
      return asset;
    }

    return storyflowPrisma.asset.update({
      where: { id: assetId },
      data: { upscaleStatus: "done" },
    });
  }

  const paths = getProjectPaths(asset.projectId);
  const settings = await getSettings();
  const width = getMetadataWidth(asset.metadata);
  if (!options.force && width >= settings.upscale.skipIfWidthPx) {
    return storyflowPrisma.asset.update({
      where: { id: assetId },
      data: { upscaleStatus: "skipped" },
    });
  }

  const inputPath = resolveAssetPath(paths.root, asset.projectId, asset.path);
  const ext = path.extname(asset.filename);
  const base = path.basename(asset.filename, ext);
  const outputFilename = `${base}_8k${ext}`;
  const outputPath = path.join(paths.assetsImages, outputFilename);
  const outputRelative = path.relative(paths.root, outputPath);

  const upscaler = new RealESRGANService();
  if (!upscaler.isAvailable()) {
    throw new ServiceUnavailableError(
      "Real-ESRGAN",
      "Binary not found. Install realesrgan-ncnn-vulkan or set REALESRGAN_PATH.",
    );
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await upscaler.upscale(inputPath, outputPath);

  const metadata = await extractMetadata(outputPath, "IMAGE").catch(() => null);

  const updated = await storyflowPrisma.asset.update({
    where: { id: assetId },
    data: {
      upscaled: true,
      upscaledPath: `/projects/${asset.projectId}/${outputRelative.replace(/\\/g, "/")}`,
      upscaleStatus: "done",
      metadata: toJsonObject(metadata),
    },
  });

  return updated;
}
