import { http, HttpResponse } from "msw";

import { buildAiCallResult, buildGeminiResponse, buildScript } from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const aiHandlers = [
  http.post(`${API_BASE}/api/ai/script`, () => {
    const script = buildScript();
    return HttpResponse.json({
      script,
      result: buildAiCallResult({ data: script }),
    });
  }),

  http.post(`${API_BASE}/api/ai/refine`, () => {
    const refined = {
      title: "Refined title",
      description: "Refined description",
    };
    return HttpResponse.json({
      result: refined,
      ai: buildAiCallResult({ data: refined }),
    });
  }),

  http.post(`${API_BASE}/api/ai/viewport`, () => {
    const response = buildGeminiResponse();
    return HttpResponse.json({
      result: response,
      ai: buildAiCallResult({ data: response }),
    });
  }),
];
