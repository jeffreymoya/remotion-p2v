import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const COMPOSITIONS_DIR = path.resolve("src/compositions");
const BARREL_PATH = path.join(COMPOSITIONS_DIR, "index.ts");

for (const entry of fs.readdirSync(COMPOSITIONS_DIR)) {
  if (entry === "index.ts") continue;
  const fullPath = path.join(COMPOSITIONS_DIR, entry);
  if (entry.endsWith(".tsx")) {
    fs.rmSync(fullPath);
    console.log(`Removed ${entry}`);
  }
}

const emptyBarrel = `export const compositions = {};\n\nexport default compositions;\n`;
fs.writeFileSync(BARREL_PATH, emptyBarrel);

execSync("npm run code", { stdio: "inherit" });
