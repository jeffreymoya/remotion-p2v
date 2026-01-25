import { useCallback, useEffect, useState } from "react";

const DEFAULT_STORAGE_KEY = "storyflow:first-run-tour:v1";

type UseFirstRunOptions = {
  /**
   * Optional key override for storing completion state in localStorage.
   * Use when running multiple independent tours.
   */
  storageKey?: string;
};

type UseFirstRunResult = {
  ready: boolean;
  isFirstRun: boolean;
  markComplete: () => void;
  reset: () => void;
};

/**
 * Tracks whether the user has completed the initial onboarding tour.
 * State is persisted in localStorage so the tour only appears once per device/browser.
 */
export function useFirstRun(options?: UseFirstRunOptions): UseFirstRunResult {
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY;
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(storageKey) === "true";
    setCompleted(seen);
    setReady(true);
  }, [storageKey]);

  const markComplete = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, "true");
    setCompleted(true);
  }, [storageKey]);

  const reset = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey);
    setCompleted(false);
  }, [storageKey]);

  return {
    ready,
    isFirstRun: ready && !completed,
    markComplete,
    reset,
  };
}

export { DEFAULT_STORAGE_KEY as FIRST_RUN_STORAGE_KEY };
