import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

export const aiHandlers = [
  http.post(`${API_BASE}/api/ai/viewport`, () => {
    const response = {
      keyframes: [
        {
          frameStart: 0,
          frameEnd: 90,
          viewport: { centerX: 0.5, centerY: 0.5, zoom: 1 },
          easing: "linear",
          transitionDurationMs: 500,
        },
      ],
    };
    return HttpResponse.json({
      result: response,
      ai: { data: response, provider: "gemini-cli" },
    });
  }),
];
