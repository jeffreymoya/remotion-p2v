import { expect, test } from "@playwright/test";

import { registerRouteMocks } from "./helpers/mock-routes";

const PROJECT_ID = "project-boards";

function parseBody(requestBody: string | null): Record<string, unknown> {
  if (!requestBody) return {};
  return JSON.parse(requestBody) as Record<string, unknown>;
}

test.describe("Storyboard standalone operations", () => {
  test.beforeEach(async ({ page }) => {
    await registerRouteMocks(page);
  });

  test("removed board upload route is unavailable (405)", async ({ request }) => {
    const response = await request.post(`/api/projects/${PROJECT_ID}/boards/upload-image`);
    // This path now resolves through the dynamic board route segment and rejects POST.
    expect(response.status()).toBe(405);
  });

  test("runs detect regions -> generate triggers -> build viewport", async ({ page }) => {
    let regionsPayload: Record<string, unknown> | null = null;
    let triggersPayload: Record<string, unknown> | null = null;
    let viewportPayload: Record<string, unknown> | null = null;

    await page.route(`**/api/projects/${PROJECT_ID}/boards/prompts**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: "1.0",
          generatedAt: new Date().toISOString(),
          prompts: [
            {
              boardId: "board-1",
              gridLayout: { rows: 2, cols: 2 },
              styleGuide: "Detective board",
              elements: [
                {
                  id: "photo-1",
                  type: "photo",
                  gridPosition: { row: 0, col: 0 },
                  description: "Main evidence photo",
                },
              ],
              segmentContexts: [],
              fullPromptText: "Create a detective board scene",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/projects/${PROJECT_ID}/boards/regions**`, async (route) => {
      regionsPayload = parseBody(route.request().postData());
      const assetId = String((regionsPayload?.assetId as string) ?? "asset-seeded");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: "1.0",
          boardId: "board-1",
          assetId,
          assetPath: "/e2e/fixtures/artifacts/images/cover.jpg",
          imageMetadata: { width: 100, height: 100, aspectRatio: 1 },
          regions: [
            {
              id: "region-1",
              elementId: "photo-1",
              gridPosition: { row: 0, col: 0 },
              bounds: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
              label: "Main photo",
              salience: 0.9,
            },
          ],
          generatedAt: new Date().toISOString(),
          warnings: [],
        }),
      });
    });

    await page.route(`**/api/projects/${PROJECT_ID}/boards/triggers**`, async (route) => {
      triggersPayload = parseBody(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          version: "1.0",
          triggers: [],
          totalWords: 10,
          totalTriggers: 2,
          generatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.route(`**/api/projects/${PROJECT_ID}/boards/viewport**`, async (route) => {
      viewportPayload = parseBody(route.request().postData());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          viewportJson: {
            version: "2.0",
            generatedBy: "boards",
            boards: [],
            wordTriggers: [],
            keyframes: [],
            generatedAt: new Date().toISOString(),
          },
          outputPath: `/projects/${PROJECT_ID}/boards/viewport.json`,
          stats: { boards: 1, triggers: 2, keyframes: 0 },
        }),
      });
    });

    await page.goto(`/projects/${PROJECT_ID}/storyboard`);
    await page.waitForLoadState("networkidle");

    const detectButton = page.getByRole("button", { name: "Detect regions" });
    const triggersButton = page.getByRole("button", { name: "Generate triggers" });
    const viewportButton = page.getByRole("button", { name: "Build viewport" });

    await expect(detectButton).toBeEnabled({ timeout: 10000 });
    await expect(triggersButton).toBeEnabled();
    await expect(viewportButton).toBeEnabled();

    await detectButton.click();
    await expect.poll(() => !!regionsPayload).toBe(true);
    expect(regionsPayload).toMatchObject({
      boardId: "board-1",
      gridLayout: { rows: 2, cols: 2 },
    });
    expect(Array.isArray(regionsPayload?.elements)).toBe(true);
    expect(typeof regionsPayload?.assetId).toBe("string");
    expect((regionsPayload?.assetId as string).length).toBeGreaterThan(0);

    await triggersButton.click();
    await expect.poll(() => !!triggersPayload).toBe(true);
    expect(triggersPayload).toEqual({});

    await viewportButton.click();
    await expect.poll(() => !!viewportPayload).toBe(true);
    expect(viewportPayload).toMatchObject({ fps: 30 });
  });
});
