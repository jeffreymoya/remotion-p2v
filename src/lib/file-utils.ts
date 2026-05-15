import fs from "node:fs";
import path from "node:path";

export function writeFileAtomically(filePath: string, content: string): void {
  const tmpPath = filePath + ".tmp";
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, filePath);
}