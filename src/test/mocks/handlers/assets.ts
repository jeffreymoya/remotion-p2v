import { http, HttpResponse } from "msw";

import { buildAsset, buildImageAsset } from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const assetsHandlers = [
  http.post(`${API_BASE}/api/assets/upload`, async ({ request }) => {
    const formData = await request.formData().catch(() => new FormData());
    const file = formData.get("file") as File | null;
    const asset = buildImageAsset({
      filename: file?.name ?? "upload.jpg",
      path: "/uploads/upload.jpg",
      type: "IMAGE",
    });
    return HttpResponse.json({ asset, success: true });
  }),

  http.post(`${API_BASE}/api/assets/import`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const asset = buildAsset({
      path: (body.url as string) ?? "/imports/asset.jpg",
      type: ((body.type as string) ?? "IMAGE") as "IMAGE",
    });
    return HttpResponse.json({ asset });
  }),

  http.post(`${API_BASE}/api/assets/upscale`, () => {
    return HttpResponse.json({ success: true, upscaledPath: "/assets/upscaled.jpg" });
  }),

  http.get(`${API_BASE}/api/assets/:id`, ({ params }) => {
    return HttpResponse.json({ asset: buildAsset({ id: params.id as string }) });
  }),

  http.delete(`${API_BASE}/api/assets/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];
