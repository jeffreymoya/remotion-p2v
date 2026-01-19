import { notFound } from "next/navigation";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { Asset, Script, Viewport as ViewportType } from "@/src/lib/storyflow/types";
import { PageContainer } from "@/components/layout/page-container";
import { SimpleViewportEditor } from "@/components/editors/viewport/simple-viewport-editor";
import { SimpleAssetMapper } from "@/components/editors/asset-mapper/simple-asset-mapper";

type Params = { params: { id: string } };

export default async function ViewportPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { assets: true, viewport: true, script: true },
  });

  if (!project) return notFound();

  const images = (project.assets || []).filter((a) => a.type === "IMAGE") as Asset[];
  const viewport = project.viewport as ViewportType | null;
  const script = project.script as Script | null;

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 4 · Viewport</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          Generate AI pan-scan keyframes for a selected image, adjust keyframes, and save.
        </p>
      </div>

      <SimpleViewportEditor projectId={project.id} images={images} initialViewport={viewport} />

      {script && images.length > 0 && (
        <div className="mt-8">
          <SimpleAssetMapper
            projectId={project.id}
            segments={script.segments}
            assets={images}
            initialMappings={(project.assetMappings as Record<number, string>) || {}}
          />
        </div>
      )}
    </PageContainer>
  );
}
