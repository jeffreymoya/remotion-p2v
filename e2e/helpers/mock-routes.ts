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

  // POST /api/tts/generate
  await page.route("**/api/tts/generate", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    await fulfillJson(route, {
      segment: {
        index: body.segmentIndex ?? 0,
        text: "Stubbed TTS segment",
        audioUrl: "/e2e/fixtures/artifacts/audio/sample.mp3",
        actualDuration: 3,
        timestamps: [{ word: "Stubbed", startMs: 0, endMs: 500 }],
      },
    });
  });

  // POST /api/assets/upscale
  await page.route("**/api/assets/upscale", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    await fulfillJson(route, {
      asset: {
        id: body.assetId ?? "asset-mock",
        projectId: "project-mock",
        type: "IMAGE",
        filename: "cover.jpg",
        path: "/e2e/fixtures/artifacts/images/cover.jpg",
        upscaled: true,
        upscaledPath: "/e2e/fixtures/artifacts/images/cover.jpg",
        upscaleStatus: "done",
      },
    });
  });

  // POST /api/projects/*/storyboard
  await page.route("**/api/projects/*/storyboard", async (route) => {
    await fulfillJson(route, { status: "BOARDS_READY", boardCount: 3 });
  });

  // POST /api/assets/import
  await page.route("**/api/assets/import", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    await fulfillJson(route, {
      asset: {
        id: "asset-imported-mock",
        projectId: body.projectId ?? "project-mock",
        type: body.type ?? "IMAGE",
        filename: body.filename ?? "imported.jpg",
        path: "/e2e/fixtures/artifacts/images/cover.jpg",
        metadata: { source: body.source ?? "stock" },
      },
    }, 201);
  });

  // POST /api/render/start (non-stateful fallback)
  await page.route("**/api/render/start", async (route) => {
    await fulfillJson(route, {
      id: "e2e-render-stub",
      projectId: "project-stub",
      quality: "DRAFT",
      status: "PENDING",
      progress: 0,
      createdAt: new Date().toISOString(),
    });
  });

  // GET /api/render/*/status (non-stateful fallback)
  await page.route("**/api/render/*/status", async (route) => {
    await fulfillJson(route, {
      id: "e2e-render-stub",
      projectId: "project-stub",
      status: "COMPLETED",
      progress: 1,
      outputPath: "e2e/fixtures/artifacts/renders/output.mp4",
    });
  });
}
