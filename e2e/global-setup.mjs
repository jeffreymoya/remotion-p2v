import { seedDatabase } from "./fixtures/seed.mjs";
import path from "node:path";
import fs from "node:fs";

function ensureArtifacts() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
  const artifacts = path.join(root, "e2e/fixtures/artifacts");
  fs.mkdirSync(artifacts, { recursive: true });
  fs.mkdirSync(path.join(artifacts, "audio"), { recursive: true });
  fs.mkdirSync(path.join(artifacts, "images"), { recursive: true });
  fs.mkdirSync(path.join(artifacts, "renders"), { recursive: true });
}

export default async function globalSetup() {
  process.env.STORYFLOW_DATABASE_URL ??= "file:./e2e/fixtures/test.db";
  process.env.DATABASE_URL ??= process.env.STORYFLOW_DATABASE_URL;
  process.env.GOOGLE_TTS_API_KEY ??= "test-key";
  process.env.SKIP_ENV_VALIDATION ??= "true";
  process.env.NODE_ENV ??= "test";

  ensureArtifacts();
  await seedDatabase();
}
