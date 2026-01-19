import { notFound } from "next/navigation";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { Asset, Board as BoardType, Script } from "@/src/lib/storyflow/types";
import { PageContainer } from "@/components/layout/page-container";
import { BoardsWorkflow } from "@/components/boards/BoardsWorkflow";

type Params = { params: { id: string } };

export default async function BoardsPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { assets: true, boards: { orderBy: { index: "asc" } }, script: true },
  });

  if (!project) return notFound();

  const images = (project.assets || []).filter((a) => a.type === "IMAGE") as Asset[];
  const boards = project.boards as unknown as BoardType[];
  const script = project.script as Script | null;

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 4 · Boards</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          Generate AI image prompts or manually create storyboard boards
        </p>
      </div>

      <BoardsWorkflow
        projectId={project.id}
        script={script}
        images={images}
        initialBoards={boards}
      />
    </PageContainer>
  );
}
