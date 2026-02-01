import { http, HttpResponse } from "msw";

import { buildAiCallResult } from "@/src/test/factories";

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

  http.get(`${API_BASE}/api/projects/:id/ai-logs/:logId`, ({ params }) => {
    return HttpResponse.json({
      log: {
        id: params.logId as string,
        provider: "gemini-cli",
        operation: "script/generate",
        status: "COMPLETED",
        prompt: "Generate script",
        response: "{}",
        createdAt: new Date().toISOString(),
      },
    });
  }),

  http.get(`${API_BASE}/api/projects/:id/ai-logs/stream`, () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: log-event\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "content-type": "text/event-stream" },
      status: 200,
    });
  }),
];
