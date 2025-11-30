/**
 * Timeout and retry utilities for resilient media operations
 */

/**
 * Wraps a promise with a timeout
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Operation name for error messages
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  retryDelayMs: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
}

/**
 * Retries an async operation with exponential backoff
 * @param operation - Async function to retry
 * @param config - Retry configuration
 * @param operationName - Name for logging
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName: string = 'Operation'
): Promise<T> {
  const {
    maxRetries,
    retryDelayMs,
    backoffMultiplier = 2,
    exponentialBackoff = true,
  } = config;

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt > maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff
        ? retryDelayMs * Math.pow(backoffMultiplier, attempt - 1)
        : retryDelayMs;

      console.warn(
        `${operationName} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `${operationName} failed after ${maxRetries} retries: ${lastError?.message}`
  );
}

/**
 * Combines timeout and retry for robust operations
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  retryConfig: RetryConfig,
  operationName: string = 'Operation'
): Promise<T> {
  return withRetry(
    () => withTimeout(operation(), timeoutMs, operationName),
    retryConfig,
    operationName
  );
}
