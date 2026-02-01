import { http, HttpResponse } from "msw";

import {
  buildBoard,
  buildBoardPlan,
  buildBoardRegion,
  buildViewportTrigger,
} from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const boardsHandlers = [
  // List boards
  http.get(`${API_BASE}/api/projects/:id/boards`, ({ params }) => {
    return HttpResponse.json({ boards: [buildBoard({ projectId: params.id as string })] });
  }),

  // Create board
  http.post(`${API_BASE}/api/projects/:id/boards`, ({ params }) => {
    return HttpResponse.json({
      board: buildBoard({ projectId: params.id as string }),
    });
  }),

  // Board detail
  http.get(`${API_BASE}/api/projects/:id/boards/:boardId`, ({ params }) => {
    return HttpResponse.json({
      board: buildBoard({
        id: params.boardId as string,
        projectId: params.id as string,
      }),
    });
  }),

  // Update board
  http.put(`${API_BASE}/api/projects/:id/boards/:boardId`, async ({ request, params }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      board: buildBoard({
        id: params.boardId as string,
        projectId: params.id as string,
        ...(body as object),
      }),
    });
  }),

  // Plan
  http.post(`${API_BASE}/api/projects/:id/boards/plan`, ({ params }) => {
    const plan = buildBoardPlan();
    return HttpResponse.json({
      boards: plan.boards,
      plan,
      projectId: params.id as string,
    });
  }),
  http.get(`${API_BASE}/api/projects/:id/boards/plan`, () => {
    const plan = buildBoardPlan();
    return HttpResponse.json({
      plan,
      boards: plan.boards.map((b, idx) => ({
        id: `board-${idx}`,
        index: idx,
        layout: { columns: 3, rows: 2 },
        plan: b,
      })),
    });
  }),

  // Prompts
  http.post(`${API_BASE}/api/projects/:id/boards/prompts`, () => {
    const plan = buildBoardPlan();
    return HttpResponse.json({
      success: true,
      data: {
        version: "1.0",
        prompts: plan.boards.map((b) => ({
          boardId: b.boardId ?? "board-0",
          gridLayout: { rows: 2, cols: 3 },
          styleGuide: "cinematic",
          elements: [],
          segmentContexts: [],
          fullPromptText: "Generate image",
        })),
        generatedAt: new Date().toISOString(),
      },
      saved: "/projects/test/boards/board-prompts.json",
    });
  }),
  http.get(`${API_BASE}/api/projects/:id/boards/prompts`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        version: "1.0",
        prompts: [],
        generatedAt: new Date().toISOString(),
      },
    });
  }),

  // Regions
  http.post(`${API_BASE}/api/projects/:id/boards/regions`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        version: "1.0",
        boardId: "board-0",
        imagePath: "/boards/board-0.png",
        imageMetadata: { width: 800, height: 600, aspectRatio: 1.33 },
        regions: [buildBoardRegion()],
        generatedAt: new Date().toISOString(),
      },
    });
  }),

  // Triggers
  http.post(`${API_BASE}/api/projects/:id/boards/triggers`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        version: "1.0",
        triggers: [buildViewportTrigger()],
        totalWords: 10,
        totalTriggers: 1,
        generatedAt: new Date().toISOString(),
      },
    });
  }),

  // Viewport build
  http.post(`${API_BASE}/api/projects/:id/boards/viewport`, () => {
    return HttpResponse.json({
      success: true,
      viewportPath: "/projects/test/viewport.json",
    });
  }),

  // Upload board image
  http.post(`${API_BASE}/api/projects/:id/boards/upload-image`, async ({ request }) => {
    const formData = await request.formData().catch(() => new FormData());
    const file = formData.get("file") as File | null;
    return HttpResponse.json({
      success: true,
      filename: file?.name ?? "board-image.jpg",
      url: "/uploads/board-image.jpg",
    });
  }),
];
