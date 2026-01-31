import { notFound } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { StatusBadge } from "@/components/projects/status-badge";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { formatDate } from "@/src/lib/storyflow/utils";
import { getCurrentStage, PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";
import { NotFoundError } from "@/app/api/lib";

const stageLabels: Record<PipelineStageId, string> = {
  script: "Script",
  media: "Media",
  storyboard: "Storyboard",
  build: "Build",
  render: "Render",
};

type Params = { params: { id: string } };

export default async function ProjectOverviewPage({ params }: Params) {
  const resolvedParams = await params;
  let project;
  try {
    project = await storyflowPrisma.project.findByIdOrThrow(resolvedParams.id, {
      include: { settings: true },
    });
  } catch (error) {
    if (error instanceof NotFoundError) return notFound();
    throw error;
  }

  const status = project.status as ProjectStatus;
  const currentStage = getCurrentStage(status);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Project overview</p>
            <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
            <p className="text-sm text-slate-400">
              Created {formatDate(project.createdAt)} • Aspect {project.aspectRatio}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <Link
              href={`/projects/${project.id}/${currentStage}`}
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow shadow-brand-600/30 hover:-translate-y-0.5"
            >
              Resume {stageLabels[currentStage]}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <OverviewCard title="Topic" value={project.topic ?? "Not set"} />
          <OverviewCard
            title="Quality"
            value={project.settings?.defaultQuality ? project.settings.defaultQuality : "draft"}
          />
          <OverviewCard title="Current Stage" value={stageLabels[currentStage]} />
          <OverviewCard title="Project ID" value={project.id} monospace />
        </div>
      </div>
    </PageContainer>
  );
}

type OverviewCardProps = {
  title: string;
  value: string;
  monospace?: boolean;
};

function OverviewCard({ title, value, monospace }: OverviewCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 shadow-inner shadow-black/20">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p
        className={`mt-2 text-sm font-semibold text-white ${monospace ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
