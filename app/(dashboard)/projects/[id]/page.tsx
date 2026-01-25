import { notFound, redirect } from "next/navigation";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { getCurrentStage, PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";

type Params = { params: { id: string } };

export default async function ProjectDetailPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true, status: true },
  });

  if (!project) return notFound();

  const currentStage = getCurrentStage(project.status as ProjectStatus);

  return redirect(routeForStage(project.id, currentStage));
}

function routeForStage(projectId: string, stage: PipelineStageId) {
  switch (stage) {
    case "script":
      return `/projects/${projectId}/script`;
    case "media":
      return `/projects/${projectId}/media`;
    case "storyboard":
      return `/projects/${projectId}/storyboard`;
    case "build":
      return `/projects/${projectId}/build`;
    case "render":
      return `/projects/${projectId}/render`;
  }
}
