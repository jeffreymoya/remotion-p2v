import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { MediaManager } from "@/components/media/media-manager";
import { StageGate } from "@/components/pipeline/stage-gate";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";
import { Asset, Board, ProjectStatus, Script } from "@/src/lib/storyflow/types";
import { NotFoundError } from "@/app/api/lib";
import { MediaStageButton } from "@/components/pipeline/media-stage-button";

type Params = { params: { id: string } };

export default async function MediaPage({ params }: Params) {
  const resolvedParams = await params;
  let project;
  try {
    project = await storyflowPrisma.project.findByIdOrThrow(resolvedParams.id, {
      include: { assets: true, settings: true, script: true, boards: { orderBy: { index: "asc" } } },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    throw error;
  }

  const assets = (project.assets as unknown as Asset[]) ?? [];
  const images = assets.filter((asset) => asset.type === "IMAGE");
  const boards = (project.boards as unknown as Board[]) ?? [];
  const script = project.script as Script | null;
  const gate = getStageGateState("media", project.status as ProjectStatus);

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 2 · Media</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          Upload project media or browse stock, then map assets in one place before moving to Storyboard.
        </p>
      </div>

      <StageGate locked={gate.locked} message={gate.message}>
        <DesktopOnlyGate>
          <div className="mb-3 flex justify-end">
            <MediaStageButton projectId={project.id} />
          </div>
          <MediaManager
            projectId={project.id}
            assets={assets}
            images={images}
            script={script}
            initialMappings={(project.assetMappings as Record<number, string>) || {}}
            selectedMusicAssetId={project.settings?.musicTrackId ?? undefined}
            initialMusicVolume={project.settings?.musicVolume ?? 0.3}
            initialBoards={boards}
          />
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
