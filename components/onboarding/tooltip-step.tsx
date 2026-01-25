"use client";

import { ReactNode, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

export type TourPlacement = "bottom" | "top" | "right" | "left";

export type TooltipStepProps = {
  target: HTMLElement | null;
  title: string;
  description: ReactNode;
  step: number;
  total: number;
  placement?: TourPlacement;
  onNext: () => void;
  onSkip: () => void;
  ctaLabel?: string;
};

type Position = {
  top: number;
  left: number;
  origin: TourPlacement;
  targetRect: DOMRect;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function TooltipStep({
  target,
  title,
  description,
  step,
  total,
  placement = "bottom",
  onNext,
  onSkip,
  ctaLabel = "Next",
}: TooltipStepProps) {
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!target) return;

    const update = () => {
      const rect = target.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const baseTop =
        placement === "top"
          ? rect.top - 12
          : placement === "left" || placement === "right"
            ? rect.top + rect.height / 2
            : rect.bottom + 12;

      const baseLeft =
        placement === "right"
          ? rect.right + 12
          : placement === "left"
            ? rect.left - 12
            : rect.left + rect.width / 2;

      const top = clamp(baseTop, 12, viewportHeight - 12);
      const left = clamp(baseLeft, 12, viewportWidth - 12);

      setPosition({ top, left, origin: placement, targetRect: rect });
    };

    update();

    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [placement, target]);

  const container = useMemo(() => document.body, []);

  if (!target || !position || !container) return null;

  const { top, left, origin, targetRect } = position;

  const cardTransform = (() => {
    switch (origin) {
      case "top":
        return "translate(-50%, -105%)";
      case "left":
        return "translate(-105%, -50%)";
      case "right":
        return "translate(12px, -50%)";
      default:
        return "translate(-50%, 12px)";
    }
  })();

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Highlight ring */}
      <div
        className="pointer-events-none absolute rounded-lg border-2 border-brand-400/70 shadow-[0_0_0_6px_rgba(168,85,247,0.25)]"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
        }}
      />

      <div
        className="pointer-events-auto absolute max-w-sm rounded-xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl shadow-black/40"
        style={{ top, left, transform: cardTransform }}
        role="dialog"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-200">
              Onboarding · Step {step} of {total}
            </p>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <div className="text-sm text-slate-300 leading-relaxed">{description}</div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-slate-700 bg-slate-800/80 p-1 text-slate-300 transition hover:text-white"
            aria-label="Skip onboarding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-brand-500 transition-[width]"
                style={{ width: `${(step / total) * 100}%` }}
              />
            </div>
            <span>
              {step} / {total}
            </span>
          </div>
          <button
            type="button"
            onClick={onNext}
            className={cn(
              "inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-brand-600/30 transition hover:-translate-y-0.5",
              step === total && "bg-emerald-600 shadow-emerald-600/30"
            )}
          >
            {step === total ? "Finish" : ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    container
  );
}
