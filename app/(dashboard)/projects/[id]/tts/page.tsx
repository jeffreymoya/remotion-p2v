import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { TTSManager } from "@/components/tts/tts-manager";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { ScriptSegment } from "@/src/lib/storyflow/types";

type Params = { params: { id: string } };

export default async function TTSPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { script: true },
  });

  if (!project) return notFound();

  const segments = (project.script?.segments as unknown as ScriptSegment[]) ?? [];

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 2.5 · TTS Audio</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          Generate text-to-speech audio with word-level timestamps for each script segment
        </p>
      </div>

      <TTSManager
        projectId={project.id}
        segments={segments}
      />
    </PageContainer>
  );
}
