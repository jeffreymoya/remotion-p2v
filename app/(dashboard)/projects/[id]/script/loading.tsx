import { PageContainer } from "@/components/layout/page-container";
import { ScriptSkeleton } from "@/components/ui/skeletons/script-skeleton";

export default function ScriptLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <div className="h-4 w-24 rounded-md bg-slate-800 animate-pulse" />
        <div className="h-7 w-48 rounded-md bg-slate-900 animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-slate-900 animate-pulse" />
      </div>
      <ScriptSkeleton segments={4} />
    </PageContainer>
  );
}
