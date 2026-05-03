import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET, PUT } from "../route";
import { NotFoundError } from "@/app/api/lib";
import type { AppSettings } from "@/src/lib/storyflow/settings";

vi.mock("@/src/lib/storyflow/settings", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

const { getSettings, updateSettings } = await import(
  "@/src/lib/storyflow/settings"
);

const sampleSettings = {
  ai: {
    provider: "gemini-cli",
    model: "gemini-2.0-flash",
    fallbackModel: "gemini-2.0-flash-lite",
    proModel: "gemini-2.0-pro",
    proFallbackModel: "gemini-2.0-pro-exp",
    temperature: 0.7,
  },
  tts: { voice: "en-US", speakingRate: 1, pitch: 0 },
  render: { defaultQuality: "draft", defaultAspectRatio: "16:9" },
  upscale: { autoEnabled: true, skipIfWidthPx: 3840 },
} satisfies AppSettings;

describe("/api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns settings on GET", async () => {
    vi.mocked(getSettings).mockResolvedValue(sampleSettings);

    const req = new NextRequest("http://localhost:3000/api/settings");
    const res = await GET(req);
    const json = await res.json();

    expect(getSettings).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(json).toEqual({ settings: sampleSettings });
  });

  it("updates settings on PUT", async () => {
    const updated = {
      ...sampleSettings,
      ai: { ...sampleSettings.ai, model: "gemini-2.0-flash-lite" },
      upscale: { autoEnabled: false, skipIfWidthPx: 4096 },
    };
    vi.mocked(updateSettings).mockResolvedValue(updated);

    const req = new NextRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        ai: { model: "gemini-2.0-flash-lite" },
        render: { defaultQuality: "high" },
        upscale: { autoEnabled: false, skipIfWidthPx: 4096 },
      }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(updateSettings).toHaveBeenCalledWith({
      ai: { model: "gemini-2.0-flash-lite" },
      render: { defaultQuality: "high" },
      upscale: { autoEnabled: false, skipIfWidthPx: 4096 },
    });
    expect(res.status).toBe(200);
    expect(json).toEqual({ settings: updated });
  });

  it("returns 400 for invalid upscale settings", async () => {
    const req = new NextRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: JSON.stringify({ upscale: { skipIfWidthPx: 0 } }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: JSON.stringify({ tts: { pitch: 50 } }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when settings cannot be updated", async () => {
    vi.mocked(updateSettings).mockRejectedValue(
      new NotFoundError("Settings", "global"),
    );

    const req = new NextRequest("http://localhost:3000/api/settings", {
      method: "PUT",
      body: JSON.stringify({ ai: { model: "missing-model" } }),
    });

    const res = await PUT(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });
});
