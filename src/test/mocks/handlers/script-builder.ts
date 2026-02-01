import { http, HttpResponse } from "msw";

import {
  buildBeat,
  buildBlueprint,
  buildScript,
  buildScriptDraft,
} from "@/src/test/factories";

const API_BASE = "http://localhost:3000";

export const scriptBuilderHandlers = [
  http.post(`${API_BASE}/api/script-builder/blueprint`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const blueprint = buildBlueprint({
      projectId: (body.projectId as string) ?? "project-script",
    });
    return HttpResponse.json({
      blueprint,
      message: `Blueprint generated with ${blueprint.beats.length} beats`,
    });
  }),

  http.post(`${API_BASE}/api/script-builder/execute`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const scriptDraft = buildScriptDraft({
      blueprintId: (body.blueprintId as string) ?? "blueprint-1",
      status: "GLUING",
    });
    return HttpResponse.json({
      scriptDraftId: scriptDraft.id,
      status: scriptDraft.status,
      totalBeats: scriptDraft.beatDrafts.length,
      message: "Script execution completed; ready for glue phase",
    });
  }),

  http.post(`${API_BASE}/api/script-builder/segment`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const script = buildScript({
      projectId: (body.projectId as string) ?? "project-script",
      segments: [(body.segments as unknown as [])?.[0] ?? buildBeat()],
    });
    return HttpResponse.json({
      script,
      message: `Script segmented into ${script.segments.length} segments`,
    });
  }),
];
