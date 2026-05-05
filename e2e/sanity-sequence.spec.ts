import { test, expect } from "@playwright/test";
import { registerRouteMocks } from "./helpers/mock-routes";
import { selectors } from "./helpers/selectors";

/**
 * Wave 5 — Full Sanity Sequence
 * Walk through the entire user pipeline using seeded project data
 * All external services (TTS, stock media, AI) are mocked via route interception
 *
 * Note: This test uses seeded project "project-scripted" to avoid mutating database state
 * A real end-to-end project creation flow would require database isolation per test
 */

const SEEDED_PROJECT_ID = "project-scripted";

test.describe("Full sanity sequence", () => {
  test.beforeEach(async ({ page }) => {
    await registerRouteMocks(page);
  });

  test("Navigate through full pipeline stages", async ({ page }) => {
    test.setTimeout(60000); // Extend timeout for full flow

    // 1. Verify project list page loads
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();

    // 2. Navigate to seeded project
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/overview`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();

    // 3. Navigate to script page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/script`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();

    // 4. Navigate to media page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/media`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();

    // Verify upload zone or media controls are present
    const hasMediaControls =
      (await page.locator('button, input[type="file"], [role="button"]')
        .count()) > 0;
    expect(hasMediaControls).toBe(true);

    // 5. Navigate to storyboard/boards page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/storyboard`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();

    // 6. Navigate to build page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/build`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible();

    // 7. Navigate to preview page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/preview`);
    await page.waitForLoadState("networkidle");
    // Just verify page loads (may show "not ready" if timeline missing)
    await expect(page.locator("body")).toBeVisible();

    // 8. Navigate to render page
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/render`);
    await page.waitForLoadState("networkidle");

    // Render page may show prerequisite warnings - just verify body loads
    await expect(page.locator("body")).toBeVisible();

    // Verify render-related content is present (heading or controls)
    const hasRenderContent =
      (await page.locator('h1').count()) > 0 ||
      (await page.locator('button, select, [role="combobox"]').count()) > 0;
    expect(hasRenderContent).toBe(true);

    // 9. Verify all pipeline stages are accessible without console errors
    const stages = [
      "script",
      "media",
      "storyboard",
      "build",
      "preview",
      "render",
    ];

    for (const stage of stages) {
      const errors: Error[] = [];
      const pageErrorHandler = (error: Error) => errors.push(error);
      page.on("pageerror", pageErrorHandler);

      await page.goto(`/projects/${SEEDED_PROJECT_ID}/${stage}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();

      // Filter out expected prerequisite errors
      const unexpectedErrors = errors.filter((error) => {
        const errorStr = String(error);
        const message = error.message || errorStr;

        if (
          (errorStr.includes("ConflictError") || message.includes("ConflictError")) &&
          (errorStr.includes("requires status") || message.includes("requires status"))
        ) {
          return false;
        }
        if (
          (errorStr.includes("NotFoundError") || message.includes("NotFoundError")) &&
          (errorStr.includes("not found") || message.includes("not found"))
        ) {
          return false;
        }
        return true;
      });

      expect(unexpectedErrors, `${stage} page should not have unexpected console errors`).toHaveLength(0);

      page.off("pageerror", pageErrorHandler);
    }
  });

  test("Pipeline stages show appropriate locked/unlocked states", async ({
    page,
  }) => {
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/script`);
    await page.waitForLoadState("networkidle");

    // Script stage should be accessible (project has script)
    await expect(page.locator("h1").first()).toBeVisible();

    // Navigate to build page - may show prerequisites
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/build`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();

    // If prerequisites are unmet, verify messaging
    const hasPrereqMessage = await page
      .locator('text=/prerequisite|required|not ready/i')
      .count();

    if (hasPrereqMessage > 0) {
      // This is expected - build requires assets/boards
      await expect(
        page.locator('text=/prerequisite|required|not ready/i')
      ).toBeVisible();
    }
  });

  test("Settings page loads and shows configuration options", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Verify page body is visible
    await expect(page.locator("body")).toBeVisible();

    // Verify some settings controls are present (AI model dropdown, etc.)
    const hasControls =
      (await page.locator('select, input[type="text"], button').count()) > 0;
    expect(hasControls).toBe(true);
  });

  test("New project page loads", async ({ page }) => {
    await page.goto("/projects/new");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(selectors.newProjectTopic)).toBeVisible();
    await expect(page.locator(selectors.newProjectName)).toBeVisible();
    await expect(page.locator(selectors.newProjectSubmit)).toBeVisible();
  });
});
