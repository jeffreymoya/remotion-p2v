import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { buildTimeline } from "@/src/lib/storyflow/timeline-builder";
import { VideoPreview } from "@/components/video/video-preview";

type Params = { params: { id: string } };

export default async function PreviewPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
  });
  if (!project) return notFound();

  const timeline = await buildTimeline(resolvedParams.id);

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 5 · Preview</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">Real-time Remotion preview with audio, subtitles, and viewport motion.</p>
      </div>

      <VideoPreview projectId={project.id} timeline={timeline} />
    </PageContainer>
  );
}
