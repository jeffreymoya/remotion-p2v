import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { RenderPanel } from "@/components/render/render-panel";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { StageGate } from "@/components/pipeline/stage-gate";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import { buildProjectArtifacts } from "@/src/lib/storyflow/pipeline/stages/build";
import dynamic from "next/dynamic";

const VideoPreview = dynamic(() => import("@/components/video/video-preview").then(m => ({ default: m.VideoPreview })), { ssr: false });
import { NotFoundError } from "@/app/api/lib";
import { BuildStageButton } from "@/components/pipeline/build-stage-button";

type Params = { params: { id: string } };

export default async function RenderPage({ params }: Params) {
  const resolvedParams = await params;
  let project;
  try {
    project = await storyflowPrisma.project.findByIdOrThrow(resolvedParams.id);
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    throw error;
  }

  const lastRender = await storyflowPrisma.render.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  const gate = getStageGateState("render", project.status as ProjectStatus);
  const timeline = await buildProjectArtifacts(resolvedParams.id);

  return (
    <PageContainer>
      <StageGate locked={gate.locked} message={gate.message}>
        <DesktopOnlyGate allowMobile>
          <div className="flex items-center justify-end pb-4">
            <BuildStageButton projectId={project.id} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <VideoPreview projectId={project.id} timeline={timeline} />
            <RenderPanel projectId={project.id} initialRender={lastRender} />
          </div>
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
