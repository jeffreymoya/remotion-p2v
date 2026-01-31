import { NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/src/lib/logger";

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Base API error class with status code and structured details
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 400 Bad Request - Invalid input or validation failure
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict - Resource state prevents operation
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Permission denied") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * 503 Service Unavailable - External service failure
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string, details?: unknown) {
    super(`Service unavailable: ${service}`, 503, "SERVICE_UNAVAILABLE", details);
    this.name = "ServiceUnavailableError";
  }
}

// =============================================================================
// ERROR RESPONSE FORMAT
// =============================================================================

interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Create a standardized error response
 */
function createErrorResponse(
  error: string,
  code: string,
  statusCode: number,
  requestId?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = { error, code };
  if (requestId) body.requestId = requestId;
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status: statusCode });
}

// =============================================================================
// ERROR HANDLER
// =============================================================================

/**
 * Handle errors in API routes with consistent logging and response format.
 *
 * @example
 * ```ts
 * export async function GET(req: Request) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     return handleApiError(error, "projects/[id]");
 *   }
 * }
 * ```
 */
const isDev = process.env.NODE_ENV === "development";

type Logger = ReturnType<typeof logger.child>;

function normalizeError(
  error: unknown
): { error: string; code: string; statusCode: number; details?: unknown } {
  if (error instanceof z.ZodError) {
    return {
      error: "Validation error",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: error.format(),
    };
  }

  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      error: isDev ? error.message : "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      statusCode: 500,
      details: isDev ? error.stack : undefined,
    };
  }

  return {
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}

export function handleApiError(
  error: unknown,
  context: string = "api",
  options?: { logger?: Logger; requestId?: string; startedAt?: number }
): NextResponse<ErrorResponse> {
  const { error: message, code, statusCode, details } = normalizeError(error);

  const requestId = options?.requestId ?? crypto.randomUUID();
  const durationMs = options?.startedAt
    ? Date.now() - options.startedAt
    : undefined;

  const log = options?.logger ?? logger.child({ context, requestId });
  const logPayload = {
    requestId,
    code,
    statusCode,
    durationMs,
    details,
  };

  const level = statusCode >= 500 ? "error" : "warn";
  log[level]({ ...logPayload, error }, `${context} request failed`);

  return createErrorResponse(message, code, statusCode, requestId, details);
}

// =============================================================================
// ASYNC HANDLER WRAPPER
// =============================================================================

type RouteHandler = (
  req: Request,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with automatic error handling.
 *
 * @example
 * ```ts
 * export const GET = withErrorHandler(async (req, { params }) => {
 *   const { id } = await params;
 *   const project = await getProject(id);
 *   if (!project) throw new NotFoundError("Project", id);
 *   return NextResponse.json(project);
 * }, "projects/[id]");
 * ```
 */
export function withErrorHandler(
  handler: RouteHandler,
  context: string
): RouteHandler {
  return async (req, ctx) => {
    const startedAt = Date.now();
    const path = new URL(req.url).pathname;
    const requestId = crypto.randomUUID();
    const log = logger.child({
      requestId,
      method: req.method,
      path,
      context,
    });

    log.info("Request started");

    try {
      const response = await handler(req, ctx);

      log.info(
        {
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
        },
        "Request completed"
      );

      return response;
    } catch (error) {
      return handleApiError(error, context, { logger: log, requestId, startedAt });
    }
  };
}

export function withStreamErrorHandler(
  handler: (
    req: Request,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<Response>,
  context: string
) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => {
    const startedAt = Date.now();
    const path = new URL(req.url).pathname;
    const requestId = crypto.randomUUID();
    const log = logger.child({ requestId, method: req.method, path, context });

    log.info("Request started");

    try {
      const response = await handler(req, ctx);

      log.info(
        {
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
        },
        "Request completed"
      );

      return response;
    } catch (error) {
      const normalized = normalizeError(error);

      log[normalized.statusCode >= 500 ? "error" : "warn"](
        {
          requestId,
          code: normalized.code,
          statusCode: normalized.statusCode,
          durationMs: Date.now() - startedAt,
          details: normalized.details,
          error,
        },
        `${context} stream failed`
      );

      const encoder = new TextEncoder();
      const body = `event: error\ndata: ${JSON.stringify({
        error: normalized.error,
        code: normalized.code,
        requestId,
        details: normalized.details,
      })}\n\n`;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(body));
          controller.close();
        },
      });

      return new Response(stream, {
        status: normalized.statusCode,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
  };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Parse and validate request JSON body with a Zod schema.
 * Throws ValidationError on failure.
 *
 * @example
 * ```ts
 * const data = await parseBody(req, mySchema);
 * ```
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ValidationError("Request validation failed", result.error.format());
  }

  return result.data;
}

/**
 * Validate query parameters with a Zod schema.
 * Throws ValidationError on failure.
 */
export function parseQuery<T>(
  req: Request,
  schema: z.ZodType<T>
): T {
  const url = new URL(req.url);
  const params: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const existing = params[key];
    if (existing === undefined) {
      params[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      params[key] = [existing, value];
    }
  }

  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ValidationError("Query validation failed", result.error.format());
  }

  return result.data;
}
