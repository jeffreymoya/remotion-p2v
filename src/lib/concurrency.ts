export function createLimiter(limit: number, queueTimeoutMs?: number): <T>(task: () => Promise<T>) => Promise<T> {
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error(`Limiter limit must be a positive finite number, got: ${limit}`);
  }

  let running = 0;
  const queue: Array<() => void> = [];

  function release(): void {
    running--;
    const next = queue.shift();
    if (next) next();
  }

  return <T>(task: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let settled = false;

      const run = async (): Promise<void> => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        try {
          const result = await task();
          if (!settled) { settled = true; resolve(result); }
        } catch (err) {
          if (!settled) { settled = true; reject(err); }
        } finally {
          release();
        }
      };

      if (running < limit) {
        running++;
        run();
      } else {
        const enqueue = () => { running++; run(); };
        if (queueTimeoutMs && queueTimeoutMs > 0) {
          timeoutId = setTimeout(() => {
            const idx = queue.indexOf(enqueue);
            if (idx !== -1) {
              queue.splice(idx, 1);
              if (!settled) {
                settled = true;
                reject(new Error(`Queue wait timed out after ${queueTimeoutMs}ms`));
              }
            }
          }, queueTimeoutMs);
        }
        queue.push(enqueue);
      }
    });
  };
}
