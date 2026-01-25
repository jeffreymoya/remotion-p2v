import { cn } from "@/src/lib/storyflow/utils";

interface StatsCardsProps {
  stats: {
    totalCalls: number;
    successRate: number;
    avgLatency: number;
    totalTokens: number;
    pendingCalls: number;
  };
}

type StatVariant = "default" | "success" | "warning" | "active";

const variantClasses: Record<StatVariant, string> = {
  default: "border-slate-800 bg-slate-900/50",
  success: "border-emerald-800/50 bg-emerald-950/30",
  warning: "border-amber-800/50 bg-amber-950/30",
  active: "border-brand-800/50 bg-brand-950/30",
};

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: StatVariant;
}

function StatCard({ label, value, variant = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-inner shadow-black/20",
        variantClasses[variant]
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const successRateFormatted = stats.successRate.toFixed(1);
  const avgLatencyFormatted = (stats.avgLatency / 1000).toFixed(1);
  const totalTokensFormatted = stats.totalTokens.toLocaleString();

  const successVariant = stats.successRate > 90 ? "success" : stats.successRate > 70 ? "default" : "warning";
  const pendingVariant = stats.pendingCalls > 0 ? "active" : "default";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <StatCard label="Total Calls" value={stats.totalCalls} />
      <StatCard label="Success Rate" value={`${successRateFormatted}%`} variant={successVariant} />
      <StatCard label="Avg Latency" value={`${avgLatencyFormatted}s`} />
      <StatCard label="Total Tokens" value={totalTokensFormatted} />
      <StatCard label="Pending" value={stats.pendingCalls} variant={pendingVariant} />
    </div>
  );
}
