import { test, expect } from "@playwright/test";

// Minimal smoke to ensure dev server + seed data are reachable
// Uses health endpoint configured in playwright.config.ts webServer.url

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/settings");
  expect(response.ok()).toBe(true);
  const json = await response.json();
  expect(json).toHaveProperty("settings");
});

// Basic page load check

test("loads home page", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBe(true);
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});
