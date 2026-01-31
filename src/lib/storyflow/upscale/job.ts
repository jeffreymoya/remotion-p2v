import path from "path";
import { mkdir } from "fs/promises";

import { ValidationError, ServiceUnavailableError } from "@/app/api/lib";
import { getProjectPaths } from "@/src/lib/paths";
import { storyflowPrisma } from "../prisma";
import { extractMetadata } from "../assets";
import { RealESRGANService } from "./realesrgan";
import { toJsonObject } from "../prisma-json";

export async function processUpscaleJob(assetId: string) {
  const asset = await storyflowPrisma.asset.findByIdOrThrow(assetId);
  if (asset.type !== "IMAGE") {
    throw new ValidationError("Upscaling is only supported for images");
  }
  if (asset.upscaled) {
    return asset;
  }

  const paths = getProjectPaths(asset.projectId);

  const inputPath = path.join(paths.root, asset.path.replace(/^\/projects\//, ""));
  const ext = path.extname(asset.filename);
  const base = path.basename(asset.filename, ext);
  const outputFilename = `${base}_8k${ext}`;
  const outputPath = path.join(paths.assetsImages, outputFilename);
  const outputRelative = path.relative(paths.root, outputPath);

  const upscaler = new RealESRGANService();
  if (!upscaler.isAvailable()) {
    throw new ServiceUnavailableError(
      "Real-ESRGAN",
      "Binary not found. Install realesrgan-ncnn-vulkan or set REALESRGAN_PATH."
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
      metadata: toJsonObject(metadata),
    },
  });

  return updated;
}
