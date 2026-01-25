import { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { StageProvider } from "@/components/pipeline/stage-context";
import { StageInvalidationProvider } from "@/components/pipeline/stage-invalidation-context";
import { KeyboardNavigation } from "@/components/pipeline/keyboard-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { getCurrentStage } from "@/src/lib/storyflow/stage-validation";

type LayoutProps = {
  children: ReactNode;
  params: { id: string };
};

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true, name: true, status: true },
  });

  if (!project) {
    return notFound();
  }

  const currentStage = getCurrentStage(project.status as never);

  return (
    <StageInvalidationProvider projectId={project.id} currentStage={currentStage}>
      <StageProvider value={{ projectId: project.id, currentStage }}>
        <KeyboardNavigation projectId={project.id} />
        <div className="space-y-6 pb-8">
          <PageContainer>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Project pipeline</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-white">{project.name}</h1>
                  <Link
                    href={`/projects/${project.id}/overview`}
                    className="text-xs font-semibold text-brand-200 hover:text-brand-100 underline underline-offset-4"
                  >
                    Overview
                  </Link>
                  <Link
                    href={`/projects/${project.id}/ai-logs`}
                    className="text-xs font-semibold text-brand-200 hover:text-brand-100 underline underline-offset-4"
                  >
                    AI Logs
                  </Link>
                </div>
              </div>
              <PipelineStepper projectId={project.id} status={project.status} />
            </div>
          </PageContainer>
          {children}
        </div>
      </StageProvider>
    </StageInvalidationProvider>
  );
}
