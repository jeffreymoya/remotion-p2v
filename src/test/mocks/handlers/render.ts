import { http, HttpResponse } from "msw";

import { buildRender } from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const renderHandlers = [
  http.post(`${API_BASE}/api/render/start`, ({ request }) => {
    void request; // unused
    const render = buildRender({ status: "PROCESSING", progress: 10 });
    return HttpResponse.json({ renderId: render.id, status: render.status, progress: render.progress });
  }),

  http.get(`${API_BASE}/api/render/:id/status`, ({ params }) => {
    const render = buildRender({
      id: params.id as string,
      status: "COMPLETED",
      progress: 100,
      outputPath: "/renders/output.mp4",
    });
    return HttpResponse.json({ render });
  }),
];
