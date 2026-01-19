import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ScriptGenerator } from "@/components/script/script-generator";
import { ScriptBuilderWorkflow } from "@/components/script-builder/script-builder-workflow";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

type Params = { params: { id: string } };

export default async function ScriptPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    include: { script: true },
  });

  if (!project) return notFound();

  // Feature flag for script builder (can be env variable or project setting)
  const useScriptBuilder = process.env.ENABLE_SCRIPT_BUILDER === "true";

  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 2 · Script</p>
        <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
        <p className="text-sm text-slate-400">
          {useScriptBuilder
            ? `Create an engagement-focused script for "${project.topic ?? project.name}" using the beat-based workflow.`
            : `Generate a narrative script for "${project.topic ?? project.name}". Scripts are read-only; regenerate to make changes.`}
        </p>
      </div>

      {useScriptBuilder ? (
        <ScriptBuilderWorkflow
          projectId={project.id}
          initialTopic={project.topic}
          initialScript={project.script}
        />
      ) : (
        <ScriptGenerator
          projectId={project.id}
          initialTopic={project.topic}
          initialScript={project.script}
        />
      )}
    </PageContainer>
  );
}
