import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  serverExternalPackages: [
    "sharp",
    "fluent-ffmpeg",
    "ffprobe-static",
    "@google-cloud/text-to-speech",
    "prisma",
    "@prisma/client",
  ],
};

export default nextConfig;
