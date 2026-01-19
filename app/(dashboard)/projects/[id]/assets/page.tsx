import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { AssetManager } from "@/components/assets/asset-manager";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

type Params = { params: { id: string } };

export default async function AssetsPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { assets: true, settings: true },
  });

  if (!project) return notFound();

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">
          Step 3 · Assets
        </p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          Upload background images, videos, or music for this project. Files are stored in the
          project workspace and appear here immediately after upload.
        </p>
      </div>

      <AssetManager
        projectId={project.id}
        assets={project.assets}
        selectedMusicAssetId={project.settings?.musicTrackId ?? undefined}
        initialMusicVolume={project.settings?.musicVolume ?? 0.3}
      />
    </PageContainer>
  );
}
