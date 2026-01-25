import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type AutoSaveSnapshot<T> = {
  payload: T;
  timestamp: number;
};

type UseAutoSaveOptions<T> = {
  data: T;
  saveFn: (payload: T) => Promise<void>;
  /**
   * localStorage key used to persist unsaved changes when a save fails.
   * When provided, the hook will attempt to read this snapshot on mount.
   */
  storageKey?: string;
  debounceMs?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
};

type UseAutoSaveResult<T> = {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  error: string | null;
  saveNow: (payload?: T) => Promise<void>;
  cachedSnapshot: AutoSaveSnapshot<T> | null;
  clearCache: () => void;
};

const isBrowser = typeof window !== "undefined";

function readSnapshot<T>(key?: string): AutoSaveSnapshot<T> | null {
  if (!key || !isBrowser) return null;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as AutoSaveSnapshot<T>;
  } catch {
    return null;
  }
}

function writeSnapshot<T>(key: string, snapshot: AutoSaveSnapshot<T>) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Ignore storage errors to keep UX non-blocking
  }
}

function clearSnapshot(key?: string) {
  if (!key || !isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Debounced auto-save hook with localStorage fallback for unsaved changes.
 * Saves are skipped when the payload hasn't changed since the last successful save.
 */
export function useAutoSave<T>({
  data,
  saveFn,
  storageKey,
  debounceMs = 1500,
  enabled = true,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveResult<T> {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedSnapshot, setCachedSnapshot] = useState<AutoSaveSnapshot<T> | null>(() =>
    readSnapshot<T>(storageKey)
  );

  const lastSavedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const serialized = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Seed last saved value so we don't immediately fire a save for server-provided data.
    if (lastSavedRef.current === null) {
      lastSavedRef.current = serialized;
    }
  }, [serialized]);

  // Persist a snapshot immediately so user input is recoverable even if a save doesn't run.
  useEffect(() => {
    if (!enabled || !storageKey) return;
    if (serialized === lastSavedRef.current) return;
    const snapshot: AutoSaveSnapshot<T> = { payload: data, timestamp: Date.now() };
    writeSnapshot(storageKey, snapshot);
    setCachedSnapshot(snapshot);
  }, [data, enabled, serialized, storageKey]);

  const clearCache = useCallback(() => {
    clearSnapshot(storageKey);
    setCachedSnapshot(null);
  }, [storageKey]);

  const saveNow = useCallback(
    async (payload?: T) => {
      const toSave = payload ?? data;
      const serializedPayload = JSON.stringify(toSave);

      if (!enabled) return;
      if (serializedPayload === lastSavedRef.current) {
        setStatus("saved");
        return;
      }

      setStatus("saving");
      setError(null);

      try {
        await saveFn(toSave);
        if (!mountedRef.current) return;
        lastSavedRef.current = serializedPayload;
        setStatus("saved");
        setLastSavedAt(new Date());
        clearCache();
      } catch (err) {
        if (!mountedRef.current) return;
        const message = err instanceof Error ? err.message : "Auto-save failed";
        setStatus("error");
        setError(message);
        if (storageKey) {
          const snapshot: AutoSaveSnapshot<T> = { payload: toSave, timestamp: Date.now() };
          writeSnapshot(storageKey, snapshot);
          setCachedSnapshot(snapshot);
        }
        onError?.(err as Error);
      }
    },
    [clearCache, data, enabled, onError, saveFn, storageKey]
  );

  useEffect(() => {
    if (!enabled) return;
    if (serialized === lastSavedRef.current) {
      setStatus("saved");
      return;
    }

    const timer = window.setTimeout(() => {
      void saveNow();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, saveNow, serialized]);

  return {
    status,
    lastSavedAt,
    error,
    saveNow,
    cachedSnapshot,
    clearCache,
  };
}
