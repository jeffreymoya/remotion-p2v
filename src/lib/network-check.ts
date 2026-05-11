import { spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

interface PingStats {
  transmitted: number;
  received: number;
  lossPercent: number;
  avgRttMs: number;
  jitterMs: number;
}

interface NetworkCheckResult {
  stable: boolean;
  stats: PingStats | null;
  attempts: number;
  error: string | null;
}

const PING_HOST = process.env.NETWORK_CHECK_HOST ?? "8.8.8.8";
const PING_COUNT = safeInt("NETWORK_CHECK_PING_COUNT", 10);
const MAX_LOSS_PCT = safeFloat("NETWORK_CHECK_MAX_LOSS_PCT", 10);
const MAX_JITTER_MS = safeFloat("NETWORK_CHECK_MAX_JITTER_MS", 100);
const MAX_RETRIES = safeInt("NETWORK_CHECK_MAX_RETRIES", 3);
const RETRY_BASE_MS = safeInt("NETWORK_CHECK_RETRY_BASE_MS", 30_000);

function safeInt(env: string, fallback: number): number {
  const raw = process.env[env];
  if (raw === undefined) return fallback;
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

function safeFloat(env: string, fallback: number): number {
  const raw = process.env[env];
  if (raw === undefined) return fallback;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

function runPing(host: string, count: number): PingStats | null {
  const result = spawnSync(
    "ping",
    ["-c", String(count), "-W", "3", host],
    { timeout: (count * 4 + 5) * 1000, encoding: "utf-8" },
  );

  if (result.error) {
    return null;
  }

  const stdout = result.stdout;
  const transmittedMatch = stdout.match(/(\d+) packets transmitted/);
  const receivedMatch = stdout.match(/(\d+) (?:packets )?received/);
  const lossMatch = stdout.match(/([\d.]+)% packet loss/);
  const rttMatch = stdout.match(
    /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/,
  );

  if (!transmittedMatch || !receivedMatch) {
    return null;
  }

  const transmitted = Number(transmittedMatch[1]);
  const received = Number(receivedMatch[1]);
  const lossPercent = lossMatch ? Number(lossMatch[1]) : 0;
  const avgRttMs = rttMatch ? Number(rttMatch[2]) : 0;
  const jitterMs = rttMatch ? Number(rttMatch[4]) : 0;

  return { transmitted, received, lossPercent, avgRttMs, jitterMs };
}

function assessStability(stats: PingStats): { stable: boolean; reason: string | null } {
  if (stats.received === 0) {
    return { stable: false, reason: `0/${stats.transmitted} packets received (100% loss)` };
  }
  if (stats.lossPercent > MAX_LOSS_PCT) {
    return {
      stable: false,
      reason: `${stats.lossPercent.toFixed(1)}% packet loss exceeds threshold ${MAX_LOSS_PCT}%`,
    };
  }
  if (stats.jitterMs > MAX_JITTER_MS) {
    return {
      stable: false,
      reason: `jitter ${stats.jitterMs.toFixed(1)}ms exceeds threshold ${MAX_JITTER_MS}ms`,
    };
  }
  return { stable: true, reason: null };
}

export async function checkNetworkStability(): Promise<NetworkCheckResult> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const backoffMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);

    process.stderr.write(
      `[network-check] probing ${PING_HOST} (attempt ${attempt}/${MAX_RETRIES}, ${PING_COUNT} pings)...\n`,
    );

    const stats = runPing(PING_HOST, PING_COUNT);

    if (!stats) {
      process.stderr.write(
        `[network-check] ping command failed (attempt ${attempt}/${MAX_RETRIES})\n`,
      );
      if (attempt < MAX_RETRIES) {
        process.stderr.write(`[network-check] retrying in ${(backoffMs / 1000).toFixed(1)}s...\n`);
        await sleep(backoffMs);
      }
      continue;
    }

    const { stable, reason } = assessStability(stats);
    process.stderr.write(
      `[network-check] ${stats.received}/${stats.transmitted} received, ` +
        `${stats.lossPercent.toFixed(0)}% loss, ` +
        `avg ${stats.avgRttMs.toFixed(1)}ms, ` +
        `jitter ${stats.jitterMs.toFixed(1)}ms\n`,
    );

    if (stable) {
      process.stderr.write("[network-check] connection stable\n");
      return { stable: true, stats, attempts: attempt, error: null };
    }

    process.stderr.write(`[network-check] unstable: ${reason}\n`);
    if (attempt < MAX_RETRIES) {
      process.stderr.write(`[network-check] retrying in ${(backoffMs / 1000).toFixed(1)}s...\n`);
      await sleep(backoffMs);
    }
  }

  return {
    stable: false,
    stats: runPing(PING_HOST, PING_COUNT),
    attempts: MAX_RETRIES,
    error: `Network unstable after ${MAX_RETRIES} retries. Check your connection or adjust NETWORK_CHECK_* env vars.`,
  };
}
