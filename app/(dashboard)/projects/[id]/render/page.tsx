import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { RenderPanel } from "@/components/render/render-panel";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { StageGate } from "@/components/pipeline/stage-gate";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import { buildTimeline } from "@/src/lib/storyflow/timeline-builder";
import { VideoPreview } from "@/components/video/video-preview";

type Params = { params: { id: string } };

export default async function RenderPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
  });
  if (!project) return notFound();

  const lastRender = await storyflowPrisma.render.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  const gate = getStageGateState("render", project.status as ProjectStatus);
  const timeline = await buildTimeline(resolvedParams.id);

  return (
    <PageContainer>
      <StageGate locked={gate.locked} message={gate.message}>
        <DesktopOnlyGate allowMobile>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <VideoPreview projectId={project.id} timeline={timeline} />
            <RenderPanel projectId={project.id} initialRender={lastRender} />
          </div>
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
