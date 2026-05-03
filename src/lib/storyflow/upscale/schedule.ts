import { ConflictError, NotFoundError } from "@/app/api/lib";
import { storyflowPrisma } from "../prisma";
import { getSettings } from "../settings";
import { processUpscaleJob } from "./job";

async function markFailed(assetId: string) {
  await storyflowPrisma.asset
    .update({
      where: { id: assetId },
      data: { upscaleStatus: "failed" },
    })
    .catch((err) => {
      console.error("[upscale] failed to persist failed status", err);
    });
}

export async function scheduleAutoUpscale(assetId: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.upscale.autoEnabled) return;

  await storyflowPrisma.asset.update({
    where: { id: assetId },
    data: { upscaleStatus: "queued" },
  });

  try {
    await processUpscaleJob(assetId);
  } catch (err) {
    console.error("[auto-upscale]", err);
    await markFailed(assetId);
  }
}

export async function processManualUpscale(assetId: string) {
  const asset = await storyflowPrisma.asset.findByIdOrThrow(assetId);
  if (!asset) {
    throw new NotFoundError("Asset", assetId);
  }

  if (asset.upscaleStatus === "queued") {
    throw new ConflictError("Image upscale already in progress");
  }

  await storyflowPrisma.asset.update({
    where: { id: assetId },
    data: { upscaleStatus: "queued" },
  });

  try {
    return await processUpscaleJob(assetId, { force: true });
  } catch (err) {
    await markFailed(assetId);
    throw err;
  }
}
