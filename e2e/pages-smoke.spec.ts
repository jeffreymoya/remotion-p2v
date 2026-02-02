import { test, expect } from "@playwright/test";

/**
 * Wave 5 — Page Smoke Tests
 * Verify all main page routes load without console errors
 */

const SEEDED_PROJECT_ID = "project-scripted";

const PAGE_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/projects", name: "Projects list" },
  { path: "/projects/new", name: "New project" },
  { path: `/projects/${SEEDED_PROJECT_ID}`, name: "Project overview (root)" },
  { path: `/projects/${SEEDED_PROJECT_ID}/overview`, name: "Project overview" },
  { path: `/projects/${SEEDED_PROJECT_ID}/script`, name: "Script" },
  { path: `/projects/${SEEDED_PROJECT_ID}/tts`, name: "TTS" },
  { path: `/projects/${SEEDED_PROJECT_ID}/media`, name: "Media" },
  { path: `/projects/${SEEDED_PROJECT_ID}/assets`, name: "Assets" },
  { path: `/projects/${SEEDED_PROJECT_ID}/storyboard`, name: "Storyboard" },
  { path: `/projects/${SEEDED_PROJECT_ID}/boards`, name: "Boards" },
  { path: `/projects/${SEEDED_PROJECT_ID}/viewport`, name: "Viewport" },
  { path: `/projects/${SEEDED_PROJECT_ID}/build`, name: "Build" },
  { path: `/projects/${SEEDED_PROJECT_ID}/preview`, name: "Preview" },
  { path: `/projects/${SEEDED_PROJECT_ID}/render`, name: "Render" },
  { path: `/projects/${SEEDED_PROJECT_ID}/ai-logs`, name: "AI logs" },
  { path: "/settings", name: "Settings" },
];

test.describe("Page smoke tests", () => {
  for (const route of PAGE_ROUTES) {
    test(`${route.name} (${route.path}) loads without errors`, async ({
      page,
    }) => {
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));

      await page.goto(route.path);

      // Verify page body is visible
      await expect(page.locator("body")).toBeVisible();

      // Filter out expected application errors (e.g., prerequisite checks)
      const unexpectedErrors = errors.filter((error) => {
        const errorStr = String(error);
        const message = error.message || errorStr;

        // Render page throws ConflictError when prerequisites aren't met - this is expected
        if (
          (errorStr.includes("ConflictError") || message.includes("ConflictError")) &&
          (errorStr.includes("requires status") || message.includes("requires status"))
        ) {
          return false;
        }
        return true;
      });

      // Verify no unexpected errors in console
      expect(
        unexpectedErrors,
        `${route.name} should not have unexpected console errors`
      ).toHaveLength(0);
    });
  }
});
