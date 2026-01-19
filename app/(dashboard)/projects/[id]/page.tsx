import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { StatusBadge } from "@/components/projects/status-badge";
import { ProjectOverview } from "@/components/projects/project-overview";
import { formatDate } from "@/src/lib/storyflow/utils";
import { ProjectStatus } from "@/src/lib/storyflow/types";

type Params = { params: { id: string } };

export default async function ProjectDetailPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!project) return notFound();

  // Check if project has refinement data
  const metadata = project.metadata as Record<string, unknown> | null;
  const hasRefinement = !!(metadata?.refinement as Record<string, unknown> | undefined)?.refinedTitle;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-sm text-slate-400">
              Created {formatDate(project.createdAt)} • Aspect {project.aspectRatio}
            </p>
          </div>
          <StatusBadge status={project.status as ProjectStatus} />
        </div>

        <ProjectOverview
          projectId={project.id}
          projectName={project.name}
          topic={project.topic}
          status={project.status}
          hasRefinement={hasRefinement}
        />
      </div>
    </PageContainer>
  );
}
