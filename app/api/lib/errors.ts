import { NextResponse } from "next/server";
import { z } from "zod";

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
}

/**
 * Create a standardized error response
 */
function createErrorResponse(
  error: string,
  code: string,
  statusCode: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = { error, code };
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
export function handleApiError(
  error: unknown,
  context: string = "api"
): NextResponse<ErrorResponse> {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    console.warn(`[${context}] Validation error:`, error.format());
    return createErrorResponse(
      "Validation error",
      "VALIDATION_ERROR",
      400,
      error.format()
    );
  }

  // Custom API errors
  if (error instanceof ApiError) {
    const level = error.statusCode >= 500 ? "error" : "warn";
    console[level](`[${context}] ${error.code}:`, error.message);
    return createErrorResponse(
      error.message,
      error.code,
      error.statusCode,
      error.details
    );
  }

  // Standard errors
  if (error instanceof Error) {
    console.error(`[${context}] Unhandled error:`, error.message, error.stack);
    return createErrorResponse(
      error.message || "An unexpected error occurred",
      "INTERNAL_ERROR",
      500
    );
  }

  // Unknown errors
  console.error(`[${context}] Unknown error:`, error);
  return createErrorResponse(
    "An unexpected error occurred",
    "INTERNAL_ERROR",
    500
  );
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
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleApiError(error, context);
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
  const params = Object.fromEntries(url.searchParams.entries());

  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ValidationError("Query validation failed", result.error.format());
  }

  return result.data;
}
