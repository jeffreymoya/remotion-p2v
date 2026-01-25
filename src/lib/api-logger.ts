import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLogging<T = any>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    const reqLogger = logger.child({
      requestId,
      method: req.method,
      path: new URL(req.url).pathname,
    });

    reqLogger.info("Request started");

    try {
      const response = await handler(req, context);

      reqLogger.info({
        statusCode: response.status,
        duration: Date.now() - start,
      }, "Request completed");

      return response;
    } catch (error) {
      reqLogger.error({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - start,
      }, "Request failed");

      throw error;
    }
  };
}
