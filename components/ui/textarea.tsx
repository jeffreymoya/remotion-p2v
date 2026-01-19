"use client";

import React from "react";
import { cn } from "@/src/lib/storyflow/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60",
        "min-h-[120px]",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
