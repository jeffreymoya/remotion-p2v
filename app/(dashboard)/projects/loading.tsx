import { PageContainer } from "@/components/layout/page-container";

export default function ProjectsLoading() {
  return (
    <PageContainer>
      <div className="mb-6">
        <div className="h-6 w-32 rounded-md bg-slate-800 animate-pulse" />
        <div className="mt-2 h-4 w-64 rounded-md bg-slate-900 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-36 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse"
          />
        ))}
      </div>
    </PageContainer>
  );
}
