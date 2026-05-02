import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

export const aiLogHandlers = [
  http.get(`${API_BASE}/api/projects/:id/ai-logs`, () => {
    return HttpResponse.json({
      logs: [
        {
          id: "log-1",
          provider: "gemini-cli",
          operation: "script/generate",
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }),
];
