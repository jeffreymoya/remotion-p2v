import { PageContainer } from "@/components/layout/page-container";
import { ProjectCardSkeleton } from "@/components/ui/skeletons/project-card-skeleton";

export default function ProjectsLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 rounded-md bg-slate-800 animate-pulse" />
          <div className="h-6 w-10 rounded-md bg-slate-900 animate-pulse" />
        </div>
        <div className="h-4 w-64 rounded-md bg-slate-900 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <ProjectCardSkeleton key={idx} />
        ))}
      </div>
    </PageContainer>
  );
}
