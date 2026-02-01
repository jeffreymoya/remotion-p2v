import { seedDatabase } from "./fixtures/seed.mjs";

export default async function globalSetup() {
  process.env.STORYFLOW_DATABASE_URL ??= "file:./e2e/fixtures/test.db";
  process.env.DATABASE_URL ??= process.env.STORYFLOW_DATABASE_URL;
  process.env.GOOGLE_TTS_API_KEY ??= "test-key";
  process.env.SKIP_ENV_VALIDATION ??= "true";
  process.env.NODE_ENV ??= "test";

  await seedDatabase();
}
