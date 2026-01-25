import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { BoardsWorkflow } from "@/components/boards/BoardsWorkflow";
import { StageGate } from "@/components/pipeline/stage-gate";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { Asset, Board as BoardType, Script, ProjectStatus } from "@/src/lib/storyflow/types";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";

type Params = { params: { id: string } };

export default async function StoryboardPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { assets: true, boards: { orderBy: { index: "asc" } }, script: true },
  });

  if (!project) return notFound();

  const images = (project.assets || []).filter((a) => a.type === "IMAGE") as Asset[];
  const boards = project.boards as unknown as BoardType[];
  const script = project.script as Script | null;
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
          <BoardsWorkflow
            projectId={project.id}
            script={script}
            images={images}
            initialBoards={boards}
          />
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
