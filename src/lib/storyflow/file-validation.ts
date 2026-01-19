import path from "path";
import sharp from "sharp";
import { AssetType } from "./types";

const ALLOWED_TYPES: Record<AssetType, string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg"],
  MUSIC: ["audio/mpeg", "audio/wav", "audio/ogg"],
};

const MAX_SIZES: Record<AssetType, number> = {
  IMAGE: 50 * 1024 * 1024,
  VIDEO: 500 * 1024 * 1024,
  AUDIO: 50 * 1024 * 1024,
  MUSIC: 50 * 1024 * 1024,
};

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

export type ValidationResult =
  | { valid: true; mime: string; ext: string }
  | { valid: false; error: string };

export function detectMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP (RIFF + WEBP)
  if (
    buffer.slice(0, 4).toString() === "RIFF" &&
    buffer.slice(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }

  // MP4 / MOV (ftyp)
  const brand = buffer.slice(4, 8).toString();
  if (brand === "ftyp") {
    const major = buffer.slice(8, 12).toString();
    if (major.includes("qt")) return "video/quicktime";
    return "video/mp4";
  }

  // WebM
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  // WAV
  if (
    buffer.slice(0, 4).toString() === "RIFF" &&
    buffer.slice(8, 12).toString() === "WAVE"
  ) {
    return "audio/wav";
  }

  // OGG
  if (buffer.slice(0, 4).toString() === "OggS") {
    return "audio/ogg";
  }

  // MP3 (ID3 header or frame sync)
  if (buffer.slice(0, 3).toString() === "ID3") {
    return "audio/mpeg";
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }

  return null;
}

export async function validateUpload(
  file: File,
  type: AssetType
): Promise<ValidationResult> {
  const sizeLimit = MAX_SIZES[type];
  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${(sizeLimit / 1024 / 1024).toFixed(0)}MB`,
    };
  }

  const buffer = Buffer.from(await file.slice(0, 32).arrayBuffer());
  const mime = detectMime(buffer) ?? file.type;
  if (!ALLOWED_TYPES[type].includes(mime)) {
    return {
      valid: false,
      error: `Invalid file type: ${mime || "unknown"}`,
    };
  }

  const ext = MIME_EXTENSION[mime];
  if (!ext) {
    return { valid: false, error: `Unsupported file extension for ${mime}` };
  }

  return { valid: true, mime, ext };
}

export function sanitizeFilename(name: string, fallbackExt: string) {
  const base = path.parse(name).name.replace(/[^a-zA-Z0-9-_]/g, "-");
  return `${base || "file"}-${Date.now()}.${fallbackExt}`;
}

export function getAssetSubdir(type: AssetType): string {
  switch (type) {
    case "IMAGE":
      return "images";
    case "VIDEO":
      return "videos";
    case "MUSIC":
      return "music";
    case "AUDIO":
    default:
      return "audio";
  }
}

export async function stripImageMetadata(filePath: string) {
  const buffer = await sharp(filePath).rotate().toBuffer();
  await sharp(buffer).withMetadata({ exif: {} }).toFile(filePath);
}

export const MAX_UPLOAD_SIZES = MAX_SIZES;
