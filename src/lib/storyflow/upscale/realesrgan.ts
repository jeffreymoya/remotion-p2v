import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type UpscaleOptions = {
  scale?: number;
  model?: string;
  tileSize?: number;
  gpuId?: number;
};

const DEFAULT_PATHS = [
  process.env.REALESRGAN_PATH,
  "/usr/local/bin/realesrgan-ncnn-vulkan",
  "/opt/homebrew/bin/realesrgan-ncnn-vulkan",
  "/usr/bin/realesrgan-ncnn-vulkan",
  path.join(process.cwd(), "bin", "realesrgan-ncnn-vulkan"),
].filter(Boolean) as string[];

export class RealESRGANService {
  private binaryPath: string | null;

  constructor(customPath?: string) {
    this.binaryPath = customPath ?? this.detectBinary();
  }

  private detectBinary(): string | null {
    for (const candidate of DEFAULT_PATHS) {
      if (candidate && existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  isAvailable(): boolean {
    return !!this.binaryPath && existsSync(this.binaryPath);
  }

  getBinaryPath(): string | null {
    return this.binaryPath;
  }

  async upscale(
    inputPath: string,
    outputPath: string,
    options: UpscaleOptions = {}
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("Real-ESRGAN binary not found. Set REALESRGAN_PATH or install realesrgan-ncnn-vulkan.");
    }

    const {
      scale = 4,
      model = "realesrgan-x4plus",
      tileSize = 256,
      gpuId = 0,
    } = options;

    await mkdir(path.dirname(outputPath), { recursive: true });

    const args = [
      "-i",
      inputPath,
      "-o",
      outputPath,
      "-s",
      scale.toString(),
      "-n",
      model,
      "-t",
      tileSize.toString(),
      "-g",
      gpuId.toString(),
    ];

    await execFileAsync(this.binaryPath as string, args, {
      timeout: 10 * 60 * 1000, // 10 minutes
    });
  }
}
