import { z } from "zod";
import type { MotionEntry, MotionFn } from "./types";
export type { MotionContext, MotionResult, MotionEntry, MotionFn } from "./types";

import * as waveMod from "./wave";
import * as bounceMod from "./bounce";
import * as floatMod from "./float";
import * as pulseMod from "./pulse";
import * as spinMod from "./spin";
import * as staticMod from "./static";

const MOTION_MODULES = [waveMod, bounceMod, floatMod, pulseMod, spinMod, staticMod] as const;

export const MotionBehavior = z.enum(
  MOTION_MODULES.map((m) => m.name) as [string, ...string[]],
);
export type MotionBehaviorType = z.infer<typeof MotionBehavior>;

export const MOTION_PLAYBOOK: Record<MotionBehaviorType, MotionFn> =
  Object.fromEntries(MOTION_MODULES.map((m) => [m.name, m.apply])) as Record<MotionBehaviorType, MotionFn>;

export const MOTION_CATALOG: MotionEntry[] = MOTION_MODULES.map((m) => m.catalogEntry);

export function assertMotionRegistrySync(): void {
  const playbookKeys = Object.keys(MOTION_PLAYBOOK).sort();
  const catalogNames = MOTION_CATALOG.map((m) => m.name).sort();
  const enumOptions = MotionBehavior.options.slice().sort();

  const allKeys = new Set([...playbookKeys, ...catalogNames, ...enumOptions]);
  const missingFromPlaybook = [...allKeys].filter((n) => !playbookKeys.includes(n));
  const missingFromCatalog = [...allKeys].filter((n) => !catalogNames.includes(n));
  const missingFromEnum = [...allKeys].filter((n) => !enumOptions.includes(n));

  const issues = [
    ...missingFromPlaybook.map((n) => `MOTION_PLAYBOOK missing: ${n}`),
    ...missingFromCatalog.map((n) => `MOTION_CATALOG missing: ${n}`),
    ...missingFromEnum.map((n) => `MotionBehavior enum missing: ${n}`),
  ];

  if (issues.length > 0) {
    throw new Error(`Motion registry out of sync:\n${issues.join("\n")}`);
  }
}
