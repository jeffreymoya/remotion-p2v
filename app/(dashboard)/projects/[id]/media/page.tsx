import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { MediaManager } from "@/components/media/media-manager";
import { StageGate } from "@/components/pipeline/stage-gate";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { getStageGateState } from "@/src/lib/storyflow/stage-validation";
import { Asset, ProjectStatus, Script } from "@/src/lib/storyflow/types";

type Params = { params: { id: string } };

export default async function MediaPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { assets: true, settings: true, script: true },
  });

  if (!project) return notFound();

  const assets = (project.assets as unknown as Asset[]) ?? [];
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
          <MediaManager
            projectId={project.id}
            assets={assets}
            script={script}
            initialMappings={(project.assetMappings as Record<number, string>) || {}}
            selectedMusicAssetId={project.settings?.musicTrackId ?? undefined}
            initialMusicVolume={project.settings?.musicVolume ?? 0.3}
          />
        </DesktopOnlyGate>
      </StageGate>
    </PageContainer>
  );
}
