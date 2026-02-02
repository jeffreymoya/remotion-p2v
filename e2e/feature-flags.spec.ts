import { test, expect } from "@playwright/test";

/**
 * Wave 5 — Feature Flag Visibility
 * Verify that feature-flagged components respect their environment variables
 *
 * Note: Currently ENABLE_SCRIPT_BUILDER is defined in env but not actively
 * toggled in the UI. This test documents the expected behavior if/when
 * feature flags are wired to conditional rendering.
 */

const SEEDED_PROJECT_ID = "project-scripted";

test.describe("Feature flag visibility", () => {
  test("Script Builder workflow renders when enabled (current default)", async ({
    page,
  }) => {
    await page.goto(`/projects/${SEEDED_PROJECT_ID}/script`);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify the script page loads successfully
    await expect(page.locator("h1").first()).toBeVisible();

    // Verify script-specific content is present (workflow or existing script)
    const hasWorkflowContent =
      (await page.locator('text=/Create an engagement-focused script/i').count()) > 0 ||
      (await page.locator('button:has-text("Start New Script")').count()) > 0;

    expect(hasWorkflowContent).toBe(true);
  });

  test.skip("Script Builder is hidden when ENABLE_SCRIPT_BUILDER=false", async ({
    page,
  }) => {
    // This test is skipped because the feature flag is not currently wired
    // to conditional rendering in the UI. When/if it is implemented, this
    // test should be enabled and the environment variable should be set
    // via playwright.config.ts webServer.env or test-level overrides.

    await page.goto(`/projects/${SEEDED_PROJECT_ID}/script`);

    const heading = await page.locator("h1:has-text('Beat-based Script')");
    expect(await heading.count()).toBe(0);
  });
});
