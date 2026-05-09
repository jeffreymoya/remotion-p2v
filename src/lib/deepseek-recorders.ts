import fs from "node:fs";

export function makeDeepSeekResponseRecorder(
  label: string,
  filePath: string,
  verbose: boolean,
): (text: string) => void {
  let started = false;
  fs.writeFileSync(filePath, "", "utf-8");
  return (text: string) => {
    fs.appendFileSync(filePath, text, "utf-8");
    if (verbose && !started) {
      process.stdout.write(`  Stream (${label}): `);
      started = true;
    }
    if (verbose) process.stdout.write(text);
  };
}

export function makeDeepSeekThinkingRecorder(filePath: string): (text: string) => void {
  fs.writeFileSync(filePath, "", "utf-8");
  return (text: string) => {
    fs.appendFileSync(filePath, text, "utf-8");
  };
}

export function makeDeepSeekRecorders(
  label: string,
  responsePath: string,
  thinkingPath: string,
  verbose: boolean,
): {
  onChunk: (text: string) => void;
  onReasoningChunk: (text: string) => void;
} {
  return {
    onChunk: makeDeepSeekResponseRecorder(label, responsePath, verbose),
    onReasoningChunk: makeDeepSeekThinkingRecorder(thinkingPath),
  };
}
