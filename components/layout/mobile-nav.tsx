"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { navigation } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/30"
        aria-expanded={open}
        aria-label="Toggle navigation"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-72 border-r border-slate-800 bg-slate-900/95 shadow-xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-lg font-semibold">StoryFlow</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.disabled ? "#" : item.href}
                    onClick={() => {
                      if (!item.disabled) setOpen(false);
                    }}
                    className={clsx(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                      item.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "text-slate-200 hover:bg-slate-800"
                    )}
                    aria-disabled={item.disabled}
                    tabIndex={item.disabled ? -1 : 0}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

