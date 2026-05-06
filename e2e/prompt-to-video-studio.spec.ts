import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const STUDIO_URL = process.env.REMOTION_STUDIO_URL ?? "http://localhost:3000";
const COMPOSITION_ID =
  process.env.PROMPT_TO_VIDEO_COMPOSITION_ID ?? "prompt-to-video-smoke";

test("generated prompt-to-video composition is visible in Studio", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto(STUDIO_URL, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(COMPOSITION_ID)).toBeVisible({
    timeout: 30_000,
  });
  await page.getByText(COMPOSITION_ID).click();
  await expect(page.locator('[data-testid="prompt-video-root"]').first()).toBeVisible({
    timeout: 30_000,
  });
  expect(consoleErrors).toEqual([]);
});

test("generated prompt-to-video composition has multiple scene sequences", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto(STUDIO_URL, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(COMPOSITION_ID)).toBeVisible({
    timeout: 30_000,
  });
  await page.getByText(COMPOSITION_ID).click();
  await expect(page.locator('[data-testid="prompt-video-root"]').first()).toBeVisible({
    timeout: 30_000,
  });

  const scenes = page.locator('[data-testid^="prompt-video-scene-"]');
  const sceneCount = await scenes.count();
  expect(sceneCount).toBeGreaterThanOrEqual(4);

  expect(consoleErrors).toEqual([]);
});

test("generated prompt-to-video composition.json has 4+ scenes", async () => {
  const compositionId = COMPOSITION_ID;
  const runId = compositionId.startsWith("prompt-to-video-")
    ? compositionId.slice("prompt-to-video-".length)
    : compositionId;
  const jsonPath = path.join(
    "public",
    "generated",
    "prompt-to-video",
    runId,
    "composition.json"
  );
  const content = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(content);
  expect(parsed.scenes).toBeDefined();
  expect(Array.isArray(parsed.scenes)).toBe(true);
  expect(parsed.scenes.length).toBeGreaterThanOrEqual(4);
});
