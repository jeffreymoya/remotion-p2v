import { http, HttpResponse } from "msw";

import {
  buildBoard,
  buildProject,
  buildTimeline,
  buildViewport,
} from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const projectHandlers = [
  // List projects
  http.get(`${API_BASE}/api/projects`, () => {
    return HttpResponse.json({ projects: [buildProject()] });
  }),

  // Get single project
  http.get(`${API_BASE}/api/projects/:id`, ({ params }) => {
    return HttpResponse.json({ project: buildProject({ id: params.id as string }) });
  }),

  // Update project
  http.patch(`${API_BASE}/api/projects/:id`, async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      project: buildProject({ id: params.id as string, ...(body as object) }),
    });
  }),

  // Asset mappings
  http.get(`${API_BASE}/api/projects/:id/mappings`, () => {
    return HttpResponse.json({ assetMappings: {} });
  }),
  http.post(`${API_BASE}/api/projects/:id/mappings`, async ({ request }) => {
    const body = (await request.json().catch(() => ({ mappings: {} }))) as {
      mappings?: Record<number, string>;
    };
    return HttpResponse.json({ assetMappings: body.mappings ?? {} });
  }),

  // Timeline build
  http.get(`${API_BASE}/api/projects/:id/timeline`, () => {
    return HttpResponse.json({ timeline: buildTimeline() });
  }),

  // Viewport get/set
  http.get(`${API_BASE}/api/projects/:id/viewport`, ({ params }) => {
    return HttpResponse.json({
      viewport: buildViewport({ projectId: params.id as string }),
    });
  }),
  http.post(`${API_BASE}/api/projects/:id/viewport`, async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      viewport: buildViewport({ projectId: params.id as string, ...(body as object) }),
    });
  }),

  // Music selection
  http.post(`${API_BASE}/api/projects/:id/music`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      selectedAssetId: "music-asset-id",
      asset: null,
      projectId: params.id as string,
    });
  }),

  // Storyboard (placeholder)
  http.post(`${API_BASE}/api/projects/:id/storyboard`, () =>
    HttpResponse.json({ success: true })
  ),
  http.get(`${API_BASE}/api/projects/:id/storyboard`, () =>
    HttpResponse.json({ boards: [buildBoard()], plan: null })
  ),

  // Media stage (placeholder)
  http.post(`${API_BASE}/api/projects/:id/media/stage`, () =>
    HttpResponse.json({ success: true })
  ),

  // Script stage (placeholder)
  http.post(`${API_BASE}/api/projects/:id/script/stage`, () =>
    HttpResponse.json({ success: true })
  ),
];
