import assert from "node:assert/strict";
import { createLimiter } from "../src/lib/concurrency";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  // ── basic limit enforcement ──
  {
    const limit = 2;
    const limiter = createLimiter(limit);
    let maxRunning = 0;
    let running = 0;

    const tasks = Array.from({ length: 6 }, (_, i) =>
      limiter(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await sleep(20 + i * 5);
        running--;
        return i;
      }),
    );

    const results = await Promise.all(tasks);
    assert.deepEqual(results, [0, 1, 2, 3, 4, 5]);
    assert.equal(maxRunning, limit, `maxRunning ${maxRunning} should equal limit ${limit}`);
    console.log("  PASS: limit enforcement");
  }

  // ── error propagation ──
  {
    const limiter = createLimiter(3);
    const task = limiter(async () => {
      throw new Error("boom");
    });
    await assert.rejects(task, /boom/);
    console.log("  PASS: error propagation");
  }

  // ── result order preserved ──
  {
    const limiter = createLimiter(1);
    const tasks = [300, 100, 200].map((ms, i) =>
      limiter(async () => {
        await sleep(ms);
        return i;
      }),
    );
    const results = await Promise.all(tasks);
    assert.deepEqual(results, [0, 1, 2]);
    console.log("  PASS: result order preserved");
  }

  // ── invalid limit ──
  {
    assert.throws(() => createLimiter(0), /positive finite/);
    assert.throws(() => createLimiter(-1), /positive finite/);
    assert.throws(() => createLimiter(NaN), /positive finite/);
    assert.throws(() => createLimiter(Infinity), /positive finite/);
    console.log("  PASS: invalid limit rejection");
  }

  // ── limit 1 sequential execution ──
  {
    const limiter = createLimiter(1);
    const order: number[] = [];
    await Promise.all(
      [0, 1, 2].map((i) =>
        limiter(async () => {
          await sleep(10);
          order.push(i);
          return i;
        }),
      ),
    );
    assert.deepEqual(order, [0, 1, 2]);
    console.log("  PASS: sequential execution with limit=1");
  }

  console.log("\nLimiter smoke passed: 5 cases");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
