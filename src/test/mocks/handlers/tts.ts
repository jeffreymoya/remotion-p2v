import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3000";

export const ttsHandlers = [
  http.post(`${API_BASE}/api/tts/generate`, () => {
    return HttpResponse.json({
      success: true,
      audioPath: "/projects/test/assets/audio/segment-0.mp3",
      words: [{ word: "Hello", start: 0, end: 500 }],
    });
  }),

  http.post(`${API_BASE}/api/tts/generate-all`, () => {
    return HttpResponse.json({
      success: true,
      items: [
        {
          segmentIndex: 0,
          audioPath: "/projects/test/assets/audio/segment-0.mp3",
        },
      ],
    });
  }),

  http.post(`${API_BASE}/api/tts/analyze-emphasis`, () => {
    return HttpResponse.json({
      success: true,
      emphasis: [{ word: "Hello", level: "high" }],
    });
  }),
];
