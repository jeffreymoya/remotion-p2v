import path from "path";
import { mkdir } from "fs/promises";
import { storyflowPrisma } from "../prisma";
import { extractMetadata } from "../assets";
import { RealESRGANService } from "./realesrgan";
import { toJsonObject } from "../prisma-json";

export async function processUpscaleJob(assetId: string) {
  const asset = await storyflowPrisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new Error("Asset not found");
  }
  if (asset.type !== "IMAGE") {
    throw new Error("Upscaling is only supported for images");
  }
  if (asset.upscaled) {
    return asset;
  }

  const inputPath = path.join(process.cwd(), "public", asset.path);
  const ext = path.extname(asset.filename);
  const base = path.basename(asset.filename, ext);
  const outputFilename = `${base}_8k${ext}`;
  const outputRelative = path.join(
    "projects",
    asset.projectId,
    "assets",
    "images",
    outputFilename
  );
  const outputPath = path.join(process.cwd(), "public", outputRelative);

  const upscaler = new RealESRGANService();
  if (!upscaler.isAvailable()) {
    throw new Error(
      "Real-ESRGAN binary not found. Install realesrgan-ncnn-vulkan or set REALESRGAN_PATH."
    );
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await upscaler.upscale(inputPath, outputPath);

  const metadata = await extractMetadata(outputPath, "IMAGE").catch(() => null);

  const updated = await storyflowPrisma.asset.update({
    where: { id: assetId },
    data: {
      upscaled: true,
      upscaledPath: `/${outputRelative.replace(/\\/g, "/")}`,
      metadata: toJsonObject(metadata),
    },
  });

  return updated;
}
