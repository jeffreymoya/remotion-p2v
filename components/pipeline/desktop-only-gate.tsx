"use client";

import { ReactNode } from "react";
import { Monitor } from "lucide-react";

type DesktopOnlyGateProps = {
  children: ReactNode;
  allowMobile?: boolean;
};

export function DesktopOnlyGate({ children, allowMobile = false }: DesktopOnlyGateProps) {
  if (allowMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Mobile warning - shows below lg (1024px) */}
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center lg:hidden">
        <Monitor className="h-16 w-16 text-slate-600" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Desktop Required</h2>
          <p className="text-sm text-slate-400 max-w-md">
            This stage requires a desktop or laptop computer (1024px or wider). Please use a larger device to access this feature.
          </p>
        </div>
      </div>

      {/* Desktop content - shows at lg and above */}
      <div className="hidden lg:block">{children}</div>
    </>
  );
}
