/**
 * API Library - Centralized utilities for API routes
 *
 * @example
 * ```ts
 * import {
 *   handleApiError,
 *   NotFoundError,
 *   ValidationError,
 *   parseBody,
 *   withErrorHandler
 * } from "@/app/api/lib";
 * ```
 */

export {
  // Error classes
  ApiError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ServiceUnavailableError,
  // Error handling
  handleApiError,
  withErrorHandler,
  // Validation helpers
  parseBody,
  parseQuery,
} from "./errors";
