export function createLimiter(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
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
      const run = async (): Promise<void> => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          release();
        }
      };

      if (running < limit) {
        running++;
        run();
      } else {
        queue.push(run);
      }
    });
  };
}
