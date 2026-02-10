import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { BoardsWorkflow } from "@/components/boards/BoardsWorkflow";
import { StageGate } from "@/components/pipeline/stage-gate";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { Asset, Board as BoardType, ProjectStatus } from "@/src/lib/storyflow/types";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";
import { NotFoundError } from "@/app/api/lib";
import { StoryboardStageButton } from "@/components/pipeline/storyboard-stage-button";

type Params = { params: { id: string } };

export default async function StoryboardPage({ params }: Params) {
  const resolvedParams = await params;
  let project;
  try {
    project = await storyflowPrisma.project.findByIdOrThrow(resolvedParams.id, {
      include: { assets: true, boards: { orderBy: { index: "asc" } } },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    throw error;
  }

  const images = (project.assets || []).filter((a) => a.type === "IMAGE") as Asset[];
  const boards = project.boards as unknown as BoardType[];
  const gate = getStageGateState("storyboard", project.status as ProjectStatus);

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 3 · Storyboard</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          AI storyboard planning with manual overrides for prompts, regions, and sequencing.
        </p>
      </div>

      <StageGate locked={gate.locked} message={gate.message}>
        <DesktopOnlyGate>
          <div className="mb-3 flex justify-end">
            <StoryboardStageButton projectId={project.id} />
          </div>
          <BoardsWorkflow
            projectId={project.id}
            images={images}
            initialBoards={boards}
          />
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
