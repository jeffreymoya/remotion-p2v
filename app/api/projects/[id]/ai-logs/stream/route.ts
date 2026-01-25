import { NextRequest } from "next/server";

import { aiLogger } from "@/src/lib/services/ai";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      const unsubscribe = aiLogger.onNewLog(async (logId) => {
        const log = await storyflowPrisma.aiCallLog.findUnique({ where: { id: logId } });
        if (log && log.projectId === projectId) {
          send({ type: "update", log });
        }
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
