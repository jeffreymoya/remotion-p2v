import { notFound, redirect } from "next/navigation";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { getCurrentStage, PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import { NotFoundError } from "@/app/api/lib";

type Params = { params: { id: string } };

export default async function ProjectDetailPage({ params }: Params) {
  const resolvedParams = await params;
  let project;
  try {
    project = await storyflowPrisma.project.findByIdOrThrow(resolvedParams.id, {
      select: { id: true, status: true },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    throw error;
  }

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
