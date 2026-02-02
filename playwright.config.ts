import { defineConfig, devices } from "@playwright/test";

const TEST_DB_URL = "file:./e2e/fixtures/test.db";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Run tests serially to avoid database conflicts
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 5_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run web:dev",
    url: "http://localhost:3000/api/settings",
    reuseExistingServer: true,
    env: {
      STORYFLOW_DATABASE_URL: TEST_DB_URL,
      DATABASE_URL: TEST_DB_URL,
      GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY ?? "test-key",
      SKIP_ENV_VALIDATION: "true",
      ENABLE_SCRIPT_BUILDER: "true",
      NODE_ENV: process.env.NODE_ENV ?? "test",
    },
    timeout: 120_000,
  },
  globalSetup: "./e2e/global-setup.mjs",
  globalTeardown: "./e2e/global-teardown.mjs",
  reporter: [["list"]],
});
