import { PageContainer } from "@/components/layout/page-container";
import { AiLogsClient } from "@/components/ai-logs/ai-logs-client";

type Params = { params: { id: string } };

export default async function AiLogsPage({ params }: Params) {
  const resolvedParams = await params;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">AI Observability</p>
          <h1 className="text-2xl font-semibold text-white">AI Call Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor AI model calls, performance metrics, and debug prompts
          </p>
        </div>

        <AiLogsClient projectId={resolvedParams.id} />
      </div>
    </PageContainer>
  );
}
