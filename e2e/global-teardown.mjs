import fs from "node:fs";
import path from "node:path";

export default async function globalTeardown() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
  const dbFile = path.join(repoRoot, "e2e/fixtures/test.db");

  try {
    fs.rmSync(dbFile, { force: true });
  } catch (err) {
    console.warn("[teardown] failed to remove test db", err);
  }
}
