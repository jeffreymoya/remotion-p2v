#!/usr/bin/env node
/**
 * Remove least-recently-used stock media from the local library to stay within budget.
 * Usage:
 *   npm run media:gc -- [--dry-run] [--target 250GB]
 */
import * as dotenv from 'dotenv';
import { LocalMediaRepo } from '../services/media/local-repo';

dotenv.config({ path: '.env.local' });
dotenv.config();

function parseBytes(input?: string): number | undefined {
  if (!input) return undefined;
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/^([0-9.]+)\s*(b|kb|mb|gb|tb)?$/);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return undefined;
  const unit = match[2] || 'b';
  const power = { b: 0, kb: 1, mb: 2, gb: 3, tb: 4 }[unit] ?? 0;
  return value * Math.pow(1024, power);
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetIdx = args.indexOf('--target');
  const targetBytes = targetIdx !== -1 ? parseBytes(args[targetIdx + 1]) : undefined;

  const repo = new LocalMediaRepo();
  try {
    await repo.ensureAvailable();
    const result = await repo.garbageCollect({ dryRun, targetBytes });

    const action = dryRun ? '[media:gc] (dry-run)' : '[media:gc]';
    console.log(`${action} Budget: ${formatBytes(result.budgetBytes)}`);
    console.log(`${action} Freed: ${formatBytes(result.freedBytes)} via ${result.removed} deletions`);
    if (result.skipped > 0) {
      console.log(`${action} Skipped protected items: ${result.skipped}`);
    }
    console.log(`${action} Remaining: ${formatBytes(result.remainingBytes)}`);
  } catch (error: any) {
    console.error('[media:gc] Failed:', error.message);
    process.exit(1);
  } finally {
    await repo.dispose();
  }
}

if (require.main === module) {
  void main();
}

export default main;
