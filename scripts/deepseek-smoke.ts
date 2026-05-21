/**
 * Smoke-tests DeepSeek V4 Pro with a tiny prompt across parameter variants to
 * identify which combination avoids both the `thinking:disabled` hang and the
 * default-thinking truncation.
 *
 * Usage:  tsx --env-file=.env scripts/deepseek-smoke.ts
 */

import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL } from "../src/lib/config";

const TIMEOUT_MS = 60_000; // 60 s per variant — enough to confirm a hang

const SYSTEM = "You are a JSON API. Return only valid JSON.";
const USER = `Return a JSON object with exactly 3 motivational quotes.
Schema: { "quotes": [ { "author": string, "text": string } ] }
Use real, famous quotes. No commentary.`;

interface Variant {
  label: string;
  model?: string;
  extraBody?: Record<string, unknown>;
  maxTokens?: number;
}

const VARIANTS: Variant[] = [
  {
    label: "A — thinking:disabled",
    extraBody: { thinking: { type: "disabled" } },
    maxTokens: 1024,
  },
  {
    label: "B — no thinking, max_tokens:1024",
    maxTokens: 1024,
  },
  {
    label: "C — thinking:enabled + effort:low, max_tokens:1024",
    extraBody: { thinking: { type: "enabled" }, reasoning_effort: "low" },
    maxTokens: 1024,
  },
  {
    label: "D — thinking:enabled + effort:low, max_tokens:8192",
    extraBody: { thinking: { type: "enabled" }, reasoning_effort: "low" },
    maxTokens: 8192,
  },
  {
    label: "E — deepseek-chat (sanity, no thinking)",
    model: "deepseek-chat",
    maxTokens: 1024,
  },
];

interface UsageBlock {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
}

async function runVariant(v: Variant): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  const model = v.model ?? DEEPSEEK_MODEL;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: USER },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
    ...(v.maxTokens !== undefined ? { max_tokens: v.maxTokens } : {}),
    ...(v.extraBody ?? {}),
  };

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Variant: ${v.label}`);
  console.log(`Payload keys: ${Object.keys(body).filter(k => k !== "messages").join(", ")}`);
  if (body.thinking) console.log(`  thinking: ${JSON.stringify(body.thinking)}`);
  if (body.reasoning_effort) console.log(`  reasoning_effort: ${body.reasoning_effort}`);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    console.log(`  ⏰ TIMED OUT after ${TIMEOUT_MS / 1000}s — likely a server-side hang`);
  }, TIMEOUT_MS);

  const start = Date.now();
  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log(`  ❌ HTTP ${res.status} after ${elapsed}s: ${text.slice(0, 200)}`);
      return;
    }

    const json = await res.json() as {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
      usage?: UsageBlock;
    };

    const choice = json.choices?.[0];
    const content = choice?.message?.content ?? "";
    const finishReason = choice?.finish_reason ?? "unknown";
    const usage = json.usage ?? {};
    const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;

    console.log(`  ✅ Returned in ${elapsed}s`);
    console.log(`  finish_reason: ${finishReason}`);
    console.log(`  tokens — prompt:${usage.prompt_tokens} completion:${usage.completion_tokens} total:${usage.total_tokens} reasoning:${reasoningTokens}`);
    console.log(`  content length: ${content.length} chars`);
    console.log(`  content start: ${content.slice(0, 150).replace(/\n/g, "↵")}`);
    console.log(`  content end:   ${content.slice(-100).replace(/\n/g, "↵")}`);

    if (finishReason === "length") {
      console.log(`  ⚠️  OUTPUT TRUNCATED (finish_reason=length) — max_tokens too low`);
    }

    // Try to parse
    try {
      const parsed = JSON.parse(content);
      console.log(`  ✅ JSON valid — quotes count: ${Array.isArray((parsed as Record<string, unknown>).quotes) ? ((parsed as Record<string, unknown>).quotes as unknown[]).length : "N/A"}`);
    } catch {
      console.log(`  ❌ JSON parse failed — content is malformed/truncated`);
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const name = err instanceof Error ? err.name : "unknown";
    const msg = err instanceof Error ? err.message.slice(0, 200) : String(err);
    console.log(`  ❌ Error after ${elapsed}s [${name}]: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  console.log(`DeepSeek Smoke Test — model: ${DEEPSEEK_MODEL}`);
  console.log(`Base URL: ${DEEPSEEK_BASE_URL}`);
  console.log(`Timeout per variant: ${TIMEOUT_MS / 1000}s`);

  // Run all variants sequentially so logs are ordered
  for (const v of VARIANTS) {
    await runVariant(v);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("Done. Interpret results:");
  console.log("  A times out       → thinking:disabled hangs on this model");
  console.log("  B finish_reason=length / small completion_tokens → model thinks by default");
  console.log("  C/D succeeds      → use thinking:enabled + large max_tokens as workaround");
  console.log("  E succeeds        → deepseek-chat is a safe fallback for non-reasoning calls");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
