import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { RenderPanel } from "@/components/render/render-panel";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

type Params = { params: { id: string } };

export default async function RenderPage({ params }: Params) {
  const resolvedParams = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id: resolvedParams.id },
  });
  if (!project) return notFound();

  const lastRender = await storyflowPrisma.render.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <RenderPanel projectId={project.id} initialRender={lastRender} />
    </PageContainer>
  );
}
