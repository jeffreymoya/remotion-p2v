import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

export const musicHandlers = [
  http.get(`${API_BASE}/api/music/library`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    return HttpResponse.json({
      tracks: query
        ? [{ id: "track-1", title: `Track for ${query}`, duration: 180 }]
        : [],
    });
  }),
];
