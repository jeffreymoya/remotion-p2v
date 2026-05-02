import { runGeminiText } from "./cli-runner";
import type { CliTextResult, OptimizerModelConfig } from "./types";

export async function generateScript(prompt: string, modelConfig: OptimizerModelConfig): Promise<CliTextResult> {
  return runGeminiText(prompt, modelConfig.geminiScriptModel);
}
