"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MobileNav } from "./mobile-nav";

const segments: Record<string, string> = {
  "/projects": "Projects",
  "/discover": "Discover",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const label =
    Object.entries(segments).find(([key]) => pathname.startsWith(key))?.[1] ??
    "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur">
      <div className="text-lg font-semibold">{label}</div>
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span
            className={clsx(
              "rounded-full border border-green-500/40 px-2 py-1",
              "bg-green-500/10 text-green-200"
            )}
          >
            Alpha
          </span>
          <Link
            href="https://github.com"
            className="text-slate-300 hover:text-white"
            target="_blank"
          >
            Docs
          </Link>
        </div>
      </div>
    </header>
  );
}
