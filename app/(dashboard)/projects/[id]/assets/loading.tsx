import { PageContainer } from "@/components/layout/page-container";
import { AssetSkeleton } from "@/components/ui/skeletons/asset-skeleton";

export default function AssetsLoading() {
  return (
    <PageContainer>
      <div className="mb-6 space-y-2">
        <div className="h-4 w-24 rounded-md bg-slate-800 animate-pulse" />
        <div className="h-7 w-64 rounded-md bg-slate-900 animate-pulse" />
        <div className="h-4 w-[60%] rounded-md bg-slate-900 animate-pulse" />
      </div>
      <AssetSkeleton count={8} />
    </PageContainer>
  );
}
