import fs from "node:fs";
import path from "node:path";
import type { Page, Route } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "../..");
const artifactsRoot = path.join(repoRoot, "e2e/fixtures/artifacts");

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

function readFixture(file: string) {
  const filePath = path.join(artifactsRoot, file);
  return fs.readFileSync(filePath);
}

export async function registerRouteMocks(page: Page) {
  // Google TTS
  await page.route("https://texttospeech.googleapis.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      body: readFixture("audio/sample.mp3"),
    });
  });

  // Pixabay
  await page.route("https://pixabay.com/api/**", async (route) => {
    await fulfillJson(route, {
      totalHits: 2,
      hits: [
        { id: 1, previewURL: "https://pixabay.com/photo-1.jpg", largeImageURL: "https://pixabay.com/photo-1.jpg" },
        { id: 2, previewURL: "https://pixabay.com/photo-2.jpg", largeImageURL: "https://pixabay.com/photo-2.jpg" },
      ],
    });
  });

  // AI routes (viewport) — return a small fixture payload to skip Gemini
  await page.route("**/api/ai/**", async (route) => {
    await fulfillJson(route, { data: { text: "stubbed-ai-response" } });
  });

  await page.route("**/api/script-builder/**", async (route) => {
    await fulfillJson(route, { data: { result: "stubbed-script-builder" } });
  });

  await page.route("**/api/boards/**/prompts", async (route) => {
    await fulfillJson(route, { prompts: [] });
  });
}
