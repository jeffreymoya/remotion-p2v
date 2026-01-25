import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { DesktopOnlyGate } from "@/components/pipeline/desktop-only-gate";
import { ScriptBuilderWorkflow } from "@/components/script-builder/script-builder-workflow";
import { ScriptFirstRunGuide } from "./first-run-guide-client";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { determineWorkflowState } from "@/src/lib/storyflow/workflow-state";

type Params = { params: { id: string } };

export default async function ScriptPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: {
      script: true,
      blueprints: {
        where: { status: { in: ["GENERATING", "PENDING_REVIEW", "APPROVED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          scriptDrafts: {
            where: { status: { notIn: ["COMPLETED", "FAILED"] } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!project) return notFound();

  const topicLabel = project.topic ?? project.name;
  const initialState = determineWorkflowState(project);

  return (
    <PageContainer>
      <ScriptFirstRunGuide />
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 1 · Script</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          {`Create an engagement-focused script for "${topicLabel}" using the beat-based workflow. TTS runs automatically after segmentation.`}
        </p>
      </div>

      <DesktopOnlyGate>
        <ScriptBuilderWorkflow
          projectId={project.id}
          initialTopic={project.topic}
          initialState={initialState}
        />
      </DesktopOnlyGate>
    </PageContainer>
  );
}
