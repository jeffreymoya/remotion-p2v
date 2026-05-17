#!/usr/bin/env tsx
// scripts/check-quotas.ts — check quota/liveness for all active API integrations

const TIMEOUT_MS = 10_000;

interface QuotaResult {
  name: string;
  status: "ok" | "live" | "no_key" | "error";
  info: string;
  detail?: string;
}

function withTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

async function checkDeepSeek(): Promise<QuotaResult> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return { name: "DeepSeek", status: "no_key", info: "no key set" };
  const res = await fetch("https://api.deepseek.com/user/balance", {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "DeepSeek", status: "error", info: `HTTP ${res.status}` };
  const data = await res.json() as {
    is_available: boolean;
    balance_infos: { currency: string; total_balance: string }[];
  };
  const available = data.is_available;
  const balances = (data.balance_infos ?? [])
    .map((b) => `${b.total_balance} ${b.currency}`)
    .join(", ");
  return {
    name: "DeepSeek",
    status: "ok",
    info: balances || "balance unknown",
    detail: `available: ${available}`,
  };
}

async function checkElevenLabs(): Promise<QuotaResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { name: "ElevenLabs", status: "no_key", info: "no key set" };
  const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": key, Accept: "application/json" },
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "ElevenLabs", status: "error", info: `HTTP ${res.status}` };
  const data = await res.json() as {
    tier: string;
    character_count: number;
    character_limit: number;
    next_character_count_reset_unix: number;
  };
  const used = data.character_count ?? 0;
  const limit = data.character_limit ?? 0;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const resetDate = data.next_character_count_reset_unix
    ? new Date(data.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)
    : "?";
  return {
    name: "ElevenLabs",
    status: "ok",
    info: `${used.toLocaleString()} / ${limit.toLocaleString()} chars (${pct}% used)`,
    detail: `plan: ${data.tier ?? "?"}, resets: ${resetDate}`,
  };
}

async function checkGoogleCloud(): Promise<QuotaResult> {
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) return { name: "Google Cloud", status: "no_key", info: "no key set" };
  const url = `https://texttospeech.googleapis.com/v1/voices?key=${key}&languageCode=en-US`;
  const res = await fetch(url, { signal: withTimeout(TIMEOUT_MS) });
  if (!res.ok) return { name: "Google Cloud", status: "error", info: `HTTP ${res.status}` };
  return { name: "Google Cloud", status: "live", info: "key valid", detail: "liveness only" };
}

async function checkPixabay(): Promise<QuotaResult> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return { name: "Pixabay", status: "no_key", info: "no key set" };
  const url = `https://pixabay.com/api/videos/?key=${key}&q=nature&per_page=3`;
  const res = await fetch(url, { signal: withTimeout(TIMEOUT_MS) });
  if (!res.ok) return { name: "Pixabay", status: "error", info: `HTTP ${res.status}` };

  const limit = res.headers.get("X-RateLimit-Limit") ?? res.headers.get("x-ratelimit-limit");
  const remaining = res.headers.get("X-RateLimit-Remaining") ?? res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("X-RateLimit-Reset") ?? res.headers.get("x-ratelimit-reset");

  if (remaining && limit) {
    const resetStr = reset
      ? new Date(Number(reset) * 1000).toLocaleTimeString()
      : "?";
    return {
      name: "Pixabay",
      status: "ok",
      info: `${remaining} / ${limit} req remaining`,
      detail: `resets: ${resetStr}`,
    };
  }
  return { name: "Pixabay", status: "live", info: "key valid", detail: "no rate-limit headers" };
}

async function checkPexels(): Promise<QuotaResult> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return { name: "Pexels", status: "no_key", info: "no key set" };
  const res = await fetch("https://api.pexels.com/videos/search?query=nature&per_page=1", {
    headers: { Authorization: key },
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "Pexels", status: "error", info: `HTTP ${res.status}` };

  const limit = res.headers.get("X-Ratelimit-Limit");
  const remaining = res.headers.get("X-Ratelimit-Remaining");
  const resetTs = res.headers.get("X-Ratelimit-Reset");

  if (remaining && limit) {
    const resetStr = resetTs
      ? new Date(Number(resetTs) * 1000).toISOString().slice(0, 10)
      : "?";
    return {
      name: "Pexels",
      status: "ok",
      info: `${Number(remaining).toLocaleString()} / ${Number(limit).toLocaleString()} remaining (monthly)`,
      detail: `resets: ${resetStr}`,
    };
  }
  return { name: "Pexels", status: "live", info: "key valid", detail: "no rate-limit headers" };
}

async function checkExa(): Promise<QuotaResult> {
  const key = process.env.EXA_API_KEY;
  if (!key) return { name: "Exa", status: "no_key", info: "no key set" };
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "test", numResults: 1 }),
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "Exa", status: "error", info: `HTTP ${res.status}` };
  return { name: "Exa", status: "live", info: "key valid", detail: "no quota endpoint" };
}

async function checkSerper(): Promise<QuotaResult> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { name: "Serper", status: "no_key", info: "no key set" };
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: "test", num: 1 }),
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "Serper", status: "error", info: `HTTP ${res.status}` };
  await res.json();
  return { name: "Serper", status: "live", info: "key valid", detail: "check dashboard for balance" };
}

async function checkLangSmith(): Promise<QuotaResult> {
  const key = process.env.LANGSMITH_API_KEY;
  if (!key) return { name: "LangSmith", status: "no_key", info: "no key set" };
  const res = await fetch("https://api.smith.langchain.com/api/v1/workspaces", {
    headers: { "X-API-Key": key, Accept: "application/json" },
    signal: withTimeout(TIMEOUT_MS),
  });
  if (!res.ok) return { name: "LangSmith", status: "error", info: `HTTP ${res.status}` };
  return { name: "LangSmith", status: "live", info: "key valid" };
}

// ANSI helpers
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function statusIcon(status: QuotaResult["status"]): string {
  if (status === "ok") return `${GREEN}✓ ok${RESET}`;
  if (status === "live") return `${GREEN}✓ live${RESET}`;
  if (status === "no_key") return `${YELLOW}~ no key${RESET}`;
  return `${RED}✗ error${RESET}`;
}

function pad(s: string, width: number): string {
  return s.padEnd(width);
}

function printTable(results: QuotaResult[]): void {
  const COL1 = 16;
  const COL2 = 12;
  const COL3 = 38;

  const header = `${BOLD}${pad("Integration", COL1)}${pad("Status", COL2)}${pad("Info", COL3)}Detail${RESET}`;
  const divider = `${DIM}${"─".repeat(COL1 + COL2 + COL3 + 20)}${RESET}`;

  console.log(header);
  console.log(divider);

  for (const r of results) {
    const icon = statusIcon(r.status);
    // icon includes ANSI codes (8 chars of invisible overhead), compensate pad
    const statusPad = COL2 + 9;
    const line = `${pad(r.name, COL1)}${icon.padEnd(statusPad)}${pad(r.info, COL3)}${r.detail ?? ""}`;
    console.log(line);
  }
}

async function main(): Promise<void> {
  console.log("\nChecking integration quotas...\n");

  const checks = [
    checkDeepSeek(),
    checkElevenLabs(),
    checkGoogleCloud(),
    checkPixabay(),
    checkPexels(),
    checkExa(),
    checkSerper(),
    checkLangSmith(),
  ];

  const settled = await Promise.allSettled(checks);
  const results: QuotaResult[] = settled.map((r, i) => {
    const names = ["DeepSeek", "ElevenLabs", "Google Cloud", "Pixabay", "Pexels", "Exa", "Serper", "LangSmith"];
    if (r.status === "rejected") {
      const msg = String(r.reason).slice(0, 60);
      return { name: names[i], status: "error" as const, info: msg };
    }
    return r.value;
  });

  printTable(results);

  const allFailed = results.every((r) => r.status === "error" || r.status === "no_key");
  if (allFailed) process.exit(1);

  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
