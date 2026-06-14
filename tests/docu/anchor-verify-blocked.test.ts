/**
 * anchor-verifier blocked-error detection + topical-queries lens validation.
 *
 * Usage:
 *   npx tsx tests/docu/anchor-verify-blocked.test.ts
 */
import { LlmError } from "../../src/lib/llm-provider";
import { TopicalLensSchema } from "../../src/lib/shared/research/topical-queries";

let passed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (!condition) throw new Error(`FAIL ${label}${detail ? `: ${detail}` : ""}`);
  passed++;
  console.log(`PASS ${label}`);
}

// ── Blocked error detection (same expression used in anchor-verifier catch) ──

function isBlockedError(err: unknown): boolean {
  return (
    (err instanceof LlmError && err.status === 403) ||
    /SAFETY_CHECK/i.test(String(err))
  );
}

function reasonPrefix(err: unknown): string {
  return isBlockedError(err) ? "blocked" : "judgment-error";
}

// LlmError with 403 and SAFETY_CHECK → blocked
{
  const err = new LlmError("SAFETY_CHECK_TYPE_BIO blocked", 403);
  assert(isBlockedError(err), "LlmError 403 with SAFETY_CHECK → blocked");
  assert(reasonPrefix(err) === "blocked", "reason prefix: blocked");
}

// LlmError with 403 but different message → still blocked (status-based)
{
  const err = new LlmError("Request blocked by safety filter", 403);
  assert(isBlockedError(err), "LlmError 403 without SAFETY_CHECK → blocked (status)");
  assert(reasonPrefix(err) === "blocked", "reason prefix: blocked (status)");
}

// LlmError with 500 → not blocked
{
  const err = new LlmError("Server error", 500);
  assert(!isBlockedError(err), "LlmError 500 → not blocked");
  assert(reasonPrefix(err) === "judgment-error", "reason prefix: judgment-error");
}

// Regular Error with SAFETY_CHECK in message → blocked (message-based)
{
  const err = new Error("SAFETY_CHECK_TYPE_BIO failure in judgment");
  assert(isBlockedError(err), "Error with SAFETY_CHECK → blocked");
  assert(reasonPrefix(err) === "blocked", "reason prefix: blocked (message)");
}

// Regular Error without SAFETY_CHECK → not blocked
{
  const err = new Error("Something broke");
  assert(!isBlockedError(err), "Error without SAFETY_CHECK → not blocked");
  assert(reasonPrefix(err) === "judgment-error", "reason prefix: judgment-error (plain)");
}

// String error with SAFETY_CHECK → blocked
{
  const err = "SAFETY_CHECK: content flagged by moderation";
  assert(isBlockedError(err), "String with SAFETY_CHECK → blocked");
}

// String error without SAFETY_CHECK → not blocked
{
  const err = "random network error";
  assert(!isBlockedError(err), "String without SAFETY_CHECK → not blocked");
}

// ── TopicalLensSchema: personal_impact ────────────────────────────────────

{
  const result = TopicalLensSchema.parse("personal_impact");
  assert(result === "personal_impact", "TopicalLensSchema.parse('personal_impact') succeeds");
}

// Regression: other lenses still parse
{
  const result = TopicalLensSchema.parse("expert_testimony");
  assert(result === "expert_testimony", "TopicalLensSchema.parse('expert_testimony') regression");
}

console.log(`\n${passed} passed`);
