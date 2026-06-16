import fs from "node:fs";
import path from "node:path";
import type { CompositionPlan } from "../pipeline/schemas";

const COMPOSITION_PLANS_PATH = "src/generated/docu-composition-plans.ts";

export function emitCompositionPlans(plans: Array<{ slug: string; plan: CompositionPlan }>): void {
  const fileContent = `\
import type { CompositionPlan } from "../lib/pipeline/schemas";

// AUTO-GENERATED - do not edit manually. Run: npm run docu <topic>
export const docuCompositionPlans: Array<{ slug: string; plan: CompositionPlan }> = ${JSON.stringify(plans, null, 2)};
`;
  fs.mkdirSync(path.dirname(COMPOSITION_PLANS_PATH), { recursive: true });
  fs.writeFileSync(COMPOSITION_PLANS_PATH, fileContent);
  console.log(`[docu:codegen] ${plans.length} s2v plan(s) -> ${COMPOSITION_PLANS_PATH}`);
}
