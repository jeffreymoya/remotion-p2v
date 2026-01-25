"use client";

import { useEffect, useMemo, useState } from "react";
import { useFirstRun } from "@/src/hooks/use-first-run";
import { TooltipStep } from "./tooltip-step";
import { TourProvider } from "./tour-provider";

const STEPS = [
  {
    id: "stepper",
    selector: '[data-onboarding="pipeline-stepper"]',
    title: "Pipeline Stepper",
    description: "Track progress across the five gated stages. Completed steps unlock navigation; locked steps stay disabled until criteria are met.",
    placement: "bottom" as const,
  },
  {
    id: "script-input",
    selector: '[data-onboarding="script-input"]',
    title: "Script Input",
    description: "Start with a clear topic. We auto-save as you type so you can experiment without losing drafts.",
    placement: "bottom" as const,
  },
  {
    id: "ai-generate",
    selector: '[data-onboarding="ai-generate"]',
    title: "AI Generate",
    description: "Run AI to draft the script and kick off TTS. You can regenerate anytime; downstream stages get flagged if structure changes.",
    placement: "right" as const,
  },
  {
    id: "save-indicator",
    selector: '[data-onboarding="save-indicator"]',
    title: "Save Indicator",
    description: "Watch auto-save status here. If a save fails, you’ll see a retry prompt and cached draft recovery.",
    placement: "left" as const,
  },
];

type FirstRunGuideProps = {
  /** Optional key to scope completion (defaults to global first-run). */
  storageKey?: string;
};

export function FirstRunGuide({ storageKey }: FirstRunGuideProps) {
  const { ready, isFirstRun, markComplete } = useFirstRun({ storageKey });
  const [stepIndex, setStepIndex] = useState(0);
  const [availableSteps, setAvailableSteps] = useState(
    [] as Array<(typeof STEPS)[number] & { element: HTMLElement }>
  );

  // Resolve DOM targets once the page is ready. Re-run when first run is active to catch late mounts.
  useEffect(() => {
    if (!ready || !isFirstRun) return;

    const resolveTargets = () => {
      const resolved = STEPS.map((step) => {
        const element = document.querySelector(step.selector) as HTMLElement | null;
        return element ? { ...step, element } : null;
      }).filter(Boolean) as Array<(typeof STEPS)[number] & { element: HTMLElement }>; // narrowing

      if (resolved.length === 0) {
        // If nothing is available, complete to avoid blocking the UI.
        markComplete();
        return;
      }

      setAvailableSteps(resolved);
      setStepIndex(0);
    };

    const timer = window.setTimeout(resolveTargets, 150);

    return () => window.clearTimeout(timer);
  }, [isFirstRun, markComplete, ready]);

  // Complete the tour if the user advances past the last step or if no steps are available.
  useEffect(() => {
    if (!ready || !isFirstRun) return;
    if (availableSteps.length === 0) return;
    if (stepIndex >= availableSteps.length) {
      markComplete();
    }
  }, [availableSteps.length, isFirstRun, markComplete, ready, stepIndex]);

  const currentStep = useMemo(
    () => availableSteps[stepIndex],
    [availableSteps, stepIndex]
  );

  if (!ready || !isFirstRun || !currentStep) return null;

  const handleNext = () => {
    if (stepIndex + 1 >= availableSteps.length) {
      markComplete();
      return;
    }
    setStepIndex((idx) => Math.min(idx + 1, availableSteps.length));
  };

  const handleSkip = () => {
    markComplete();
  };

  return (
    <TourProvider
      value={{
        step: stepIndex + 1,
        total: availableSteps.length,
        next: handleNext,
        skip: handleSkip,
      }}
    >
      <TooltipStep
        target={currentStep.element}
        title={currentStep.title}
        description={currentStep.description}
        step={stepIndex + 1}
        total={availableSteps.length}
        placement={currentStep.placement}
        onNext={handleNext}
        onSkip={handleSkip}
        ctaLabel={stepIndex + 1 === availableSteps.length ? "Done" : "Next"}
      />
    </TourProvider>
  );
}
