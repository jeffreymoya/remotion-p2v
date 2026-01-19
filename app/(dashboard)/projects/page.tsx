import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { ProjectGrid } from "@/components/projects/project-grid";
import { EmptyState } from "@/components/projects/empty-state";

export default async function ProjectsPage() {
  const projects = await storyflowPrisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-400">
            Manage StoryFlow projects. This is Wave 1 foundation.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5"
        >
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </PageContainer>
  );
}
