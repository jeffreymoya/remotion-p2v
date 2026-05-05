import { test, expect } from "@playwright/test";
import { registerRouteMocks } from "./helpers/mock-routes";

const PROJECT_ID = "project-renderable";
const RENDER_ID = "e2e-render-1";

test.describe("Render pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await registerRouteMocks(page);
  });

  test("start render → poll PROCESSING → COMPLETED → download link", async ({ page }) => {
    test.setTimeout(20_000);

    await page.route("**/api/render/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: RENDER_ID, projectId: PROJECT_ID,
          quality: "DRAFT", status: "PENDING", progress: 0,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    let pollCount = 0;
    await page.route(`**/api/render/${RENDER_ID}/status`, async (route) => {
      pollCount++;
      const status = pollCount <= 5 ? "PROCESSING" : "COMPLETED";
      const progress = pollCount <= 5 ? Math.min(pollCount * 0.15, 0.95) : 1;
      const extra = status === "COMPLETED"
        ? { outputPath: "e2e/fixtures/artifacts/renders/output.mp4" }
        : {};
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: RENDER_ID, projectId: PROJECT_ID, status, progress, ...extra }),
      });
    });

    await page.goto(`/projects/${PROJECT_ID}/render`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="video-preview-fallback"]')).toBeVisible();

    const draftBtn = page.locator('[data-testid="render-draft-button"]');
    await expect(draftBtn).toBeVisible();
    await expect(draftBtn).toBeEnabled();
    await draftBtn.click();

    const statusEl = page.locator('[data-testid="render-status"]');
    await expect(statusEl).toHaveText("COMPLETED", { timeout: 15_000 });

    await expect(page.locator('[data-testid="render-progress-bar"]'))
      .toHaveAttribute("style", /width:\s*100%/);
    await expect(page.locator('[data-testid="render-download-link"]')).toBeVisible();
  });

  test("buttons disabled while PROCESSING", async ({ page }) => {
    await page.route("**/api/render/start", async (route) => {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-3", projectId: PROJECT_ID,
          quality: "DRAFT", status: "PENDING", progress: 0,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    await page.route("**/api/render/e2e-render-3/status", async (route) => {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-3", projectId: PROJECT_ID,
          status: "PROCESSING", progress: 0.3,
        }),
      });
    });

    await page.goto(`/projects/${PROJECT_ID}/render`);
    await page.waitForLoadState("networkidle");

    await page.locator('[data-testid="render-draft-button"]').click();
    await expect(page.locator('[data-testid="render-draft-button"]')).toBeDisabled({ timeout: 5_000 });
    await expect(page.locator('[data-testid="render-production-button"]')).toBeDisabled();
  });

  test("Production render — start → poll → COMPLETED", async ({ page }) => {
    test.setTimeout(20_000);

    await page.route("**/api/render/start", async (route) => {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-2", projectId: PROJECT_ID,
          quality: "PRODUCTION", status: "PENDING", progress: 0,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    let pollCount = 0;
    await page.route("**/api/render/e2e-render-2/status", async (route) => {
      pollCount++;
      const status = pollCount <= 3 ? "PROCESSING" : "COMPLETED";
      const progress = pollCount <= 3 ? pollCount * 0.25 : 1;
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-2", projectId: PROJECT_ID,
          quality: "PRODUCTION", status, progress,
          ...(status === "COMPLETED" ? { outputPath: "e2e/fixtures/artifacts/renders/output.mp4" } : {}),
        }),
      });
    });

    await page.goto(`/projects/${PROJECT_ID}/render`);
    await page.waitForLoadState("networkidle");

    await page.locator('[data-testid="render-production-button"]').click();
    await expect(page.locator('[data-testid="render-status"]')).toHaveText("COMPLETED", { timeout: 15_000 });
    await expect(page.locator('[data-testid="render-download-link"]')).toBeVisible();
  });

  test("Render fails — FAILED status → error shown → retry", async ({ page }) => {
    await page.route("**/api/render/start", async (route) => {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-4", projectId: PROJECT_ID,
          quality: "DRAFT", status: "FAILED", progress: 0.6, error: "GPU out of memory",
          createdAt: new Date().toISOString(),
        }),
      });
    });

    await page.route("**/api/render/e2e-render-4/status", async (route) => {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          id: "e2e-render-4", projectId: PROJECT_ID,
          status: "FAILED", progress: 0.6, error: "GPU out of memory",
        }),
      });
    });

    await page.goto(`/projects/${PROJECT_ID}/render`);
    await page.waitForLoadState("networkidle");

    await page.locator('[data-testid="render-draft-button"]').click();
    await expect(page.locator("text=GPU out of memory")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });
});
