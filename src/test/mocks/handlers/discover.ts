import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

export const discoverHandlers = [
  http.get(`${API_BASE}/api/discover`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "topic";
    return HttpResponse.json({ suggestions: [`${q} idea 1`, `${q} idea 2`] });
  }),
  http.post(`${API_BASE}/api/discover/generalize`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const topic = (body.topic as string) ?? "topic";
    return HttpResponse.json({ generalized: `${topic} (generalized)` });
  }),
];
