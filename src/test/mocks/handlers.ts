import { http, HttpResponse } from "msw";

// Base URL for API routes
const API_BASE = "http://localhost:3000";

export const handlers = [
  // Projects API
  http.get(`${API_BASE}/api/projects`, () => {
    return HttpResponse.json({
      projects: [
        { id: "1", name: "Test Project", status: "DRAFT" },
      ],
    });
  }),

  http.get(`${API_BASE}/api/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      project: { id: params.id, name: "Test Project", status: "DRAFT" },
    });
  }),

  http.patch(`${API_BASE}/api/projects/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      project: { id: params.id, ...body },
    });
  }),

  // Music library
  http.get(`${API_BASE}/api/music/library`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    return HttpResponse.json({
      tracks: query
        ? [{ id: "1", title: `Track matching "${query}"`, duration: 180 }]
        : [],
    });
  }),

  // Asset search (stock media)
  http.get(`${API_BASE}/api/assets/search`, () => {
    return HttpResponse.json({
      results: [
        { id: "img1", url: "https://example.com/image.jpg", source: "pexels" },
      ],
    });
  }),

  // Script builder execution status
  http.get(`${API_BASE}/api/script-builder/execute/:draftId/status`, () => {
    return HttpResponse.json({
      status: "COMPLETED",
      currentBeatIndex: 5,
      completedBeats: 5,
      totalBeats: 5,
      progress: 100,
    });
  }),

  // TTS generation
  http.post(`${API_BASE}/api/tts/generate`, async () => {
    return HttpResponse.json({
      success: true,
      audioPath: "/projects/test/assets/audio/segment-0.mp3",
      words: [{ word: "Hello", start: 0, end: 500 }],
    });
  }),
];
