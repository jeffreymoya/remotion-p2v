import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffprobe from "ffprobe-static";

import { storyflowPrisma } from "./prisma";
import { AssetType, AssetMetadata } from "./types";
import {
  getAssetSubdir,
  sanitizeFilename,
  stripImageMetadata,
} from "./file-validation";
import { ensureProjectDirs, getPublicDir } from "@/src/lib/paths";

let ffprobeConfigured = false;
function ensureFfprobe() {
  if (!ffprobeConfigured && ffprobe?.path) {
    ffmpeg.setFfprobePath(ffprobe.path);
    ffprobeConfigured = true;
  }
}

export async function listAssets(projectId: string) {
  return storyflowPrisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveAssetFile(
  projectId: string,
  type: AssetType,
  file: File,
  buffer: Buffer,
  ext: string
) {
  const paths = await ensureProjectDirs(projectId);
  const subdir = getAssetSubdir(type);
  const filename = sanitizeFilename(file.name, ext);
  const assetDir = path.join(paths.assets, subdir);
  const absolutePath = path.join(assetDir, filename);
  const relativePath = path.relative(getPublicDir(), absolutePath);

  await mkdir(assetDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  if (type === "IMAGE") {
    await stripImageMetadata(absolutePath);
  }

  return { filename, relativePath, absolutePath };
}

export async function saveAssetBuffer(
  projectId: string,
  type: AssetType,
  filename: string,
  buffer: Buffer
) {
  const paths = await ensureProjectDirs(projectId);
  const subdir = getAssetSubdir(type);
  const ext = path.extname(filename) || ".bin";
  const safeName = sanitizeFilename(filename, ext.replace(".", ""));
  const assetDir = path.join(paths.assets, subdir);
  const absolutePath = path.join(assetDir, safeName);
  const relativePath = path.relative(getPublicDir(), absolutePath);

  await mkdir(assetDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  if (type === "IMAGE") {
    await stripImageMetadata(absolutePath);
  }

  return { filename: safeName, relativePath, absolutePath };
}

export async function extractMetadata(
  filePath: string,
  type: AssetType
): Promise<AssetMetadata> {
  if (type === "IMAGE") {
    const data = await sharp(filePath).metadata();
    return {
      width: data.width,
      height: data.height,
      format: data.format ?? null,
      size: data.size,
    };
  }

  if (type === "VIDEO" || type === "AUDIO" || type === "MUSIC") {
    ensureFfprobe();
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err || !data.format) {
          return reject(err ?? new Error("Unable to parse media metadata"));
        }
        const stream =
          data.streams?.find((s) => s.codec_type === "video") ??
          data.streams?.find((s) => s.codec_type === "audio");
        resolve({
          width: stream?.width,
          height: stream?.height,
          duration: data.format.duration ? Number(data.format.duration) : undefined,
          format: data.format.format_long_name ?? stream?.codec_long_name ?? null,
          codec: stream?.codec_name ?? null,
          bitrate: data.format.bit_rate ? Number(data.format.bit_rate) : null,
          size: data.format.size ? Number(data.format.size) : undefined,
        });
      });
    });
  }

  throw new Error(`Unsupported asset type: ${type}`);
}

export async function deleteAsset(assetId: string) {
  const asset = await storyflowPrisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return null;
  }

  // Delete DB record first - if this fails, no filesystem changes occur
  await storyflowPrisma.asset.delete({ where: { id: assetId } });

  // File deletion is best-effort after successful DB delete
  // Orphaned files are acceptable; orphaned DB rows pointing to missing files are not
  const publicDir = getPublicDir();
  const absolutePath = path.join(publicDir, asset.path.replace(/^\//, ""));
  await rm(absolutePath, { force: true }).catch(() => {});
  if (asset.upscaledPath) {
    const upscaledAbs = path.join(publicDir, asset.upscaledPath.replace(/^\//, ""));
    await rm(upscaledAbs, { force: true }).catch(() => {});
  }

  return asset;
}
