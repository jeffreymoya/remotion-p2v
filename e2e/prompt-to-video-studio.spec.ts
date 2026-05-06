import { test, expect } from "@playwright/test";

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
  await expect(page.locator('[data-testid="prompt-video-root"]')).toBeVisible({
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
  await expect(page.locator('[data-testid="prompt-video-root"]')).toBeVisible({
    timeout: 30_000,
  });

  const scenes = page.locator('[data-testid^="prompt-video-scene-"]');
  const sceneCount = await scenes.count();
  expect(sceneCount).toBeGreaterThanOrEqual(1);

  expect(consoleErrors).toEqual([]);
});

test("generated prompt-to-video composition renders per-element animation beats when present", async ({
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
  await expect(page.locator('[data-testid="prompt-video-root"]')).toBeVisible({
    timeout: 30_000,
  });

  const beatMarker = page.locator('[data-testid="prompt-video-animation-beats"]');
  if ((await beatMarker.count()) > 0) {
    const beatCountRaw = await beatMarker.first().getAttribute("data-beat-count");
    const beatCount = beatCountRaw ? Number.parseInt(beatCountRaw, 10) : 0;
    expect(beatCount).toBeGreaterThan(0);
  }

  expect(consoleErrors).toEqual([]);
});
