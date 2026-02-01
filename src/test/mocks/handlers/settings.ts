import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

const defaultSettings = {
  ai: { provider: "gemini-cli", model: "gemini-2.5-pro" },
  tts: { voice: "en-US-Chirp3-HD-Algieba", speakingRate: 1.0, pitch: 0 },
  render: { defaultQuality: "draft", defaultAspectRatio: "16:9" },
};

export const settingsHandlers = [
  http.get(`${API_BASE}/api/settings`, () => {
    return HttpResponse.json({ settings: defaultSettings });
  }),
  http.post(`${API_BASE}/api/settings`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({ settings: { ...defaultSettings, ...body } });
  }),
];
