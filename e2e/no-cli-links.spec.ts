import { test, expect } from "@playwright/test";

/**
 * Wave 5 — CLI Removal Regression
 * Verify no dead CLI references in the UI after CLI removal
 */

const SEEDED_PROJECT_ID = "project-scripted";

const PAGES_TO_CHECK = [
  { path: "/", name: "Home" },
  { path: "/projects", name: "Projects list" },
  { path: `/projects/${SEEDED_PROJECT_ID}/overview`, name: "Overview" },
  { path: `/projects/${SEEDED_PROJECT_ID}/script`, name: "Script" },
  { path: `/projects/${SEEDED_PROJECT_ID}/media`, name: "Media" },
  { path: `/projects/${SEEDED_PROJECT_ID}/render`, name: "Render" },
  { path: "/settings", name: "Settings" },
];

test.describe("CLI removal regression", () => {
  test("no CLI references in UI text", async ({ page }) => {
    for (const route of PAGES_TO_CHECK) {
      await page.goto(route.path);

      // Search for CLI-related text (case-insensitive)
      const cliPatterns = [
        /command[- ]?line/i,
        /\bCLI\b/,
        /terminal/i,
        /npm run cli/i,
        /storyflow-cli/i,
      ];

      for (const pattern of cliPatterns) {
        const matches = await page.locator(`text=${pattern}`).count();

        // Allow zero matches (expected) or matches in code blocks/help text
        // that are clearly not actionable CLI references
        if (matches > 0) {
          const elements = await page.locator(`text=${pattern}`).all();
          for (const element of elements) {
            const text = await element.textContent();
            const tagName = await element.evaluate((el) => el.tagName);

            // Flag suspicious CLI references (not in code/pre tags, not in help text)
            if (
              tagName !== "CODE" &&
              tagName !== "PRE" &&
              !text?.includes("(deprecated)") &&
              !text?.includes("no longer available")
            ) {
              throw new Error(
                `Found suspicious CLI reference on ${route.name}: "${text}" in <${tagName}>`
              );
            }
          }
        }
      }
    }
  });

  test("no broken links to CLI-only routes", async ({ page }) => {
    await page.goto("/");

    // Check for any links that might point to removed CLI routes
    const allLinks = await page.locator("a[href]").all();

    for (const link of allLinks) {
      const href = await link.getAttribute("href");

      if (href) {
        // Flag any links to CLI-specific routes (if any existed)
        const cliRoutePatterns = [/\/cli\//i, /\/command\//i];

        for (const pattern of cliRoutePatterns) {
          if (pattern.test(href)) {
            throw new Error(
              `Found link to potential CLI-only route: ${href}`
            );
          }
        }
      }
    }
  });
});
