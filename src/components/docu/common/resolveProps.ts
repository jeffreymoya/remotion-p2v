import type { ZodType } from "zod";

/**
 * Validate and resolve a component's props at the call boundary. Merges
 * caller-supplied props immutably over the component defaults, then parses the
 * result against the component schema so malformed input fails loudly here
 * instead of rendering a broken or blank frame.
 */
export const resolveProps = <T>(
  schema: ZodType<T>,
  defaults: T,
  props: Partial<T>,
): T => {
  const merged = { ...defaults, ...props };
  const result = schema.safeParse(merged);
  if (!result.success) {
    throw new Error(`resolveProps: invalid props — ${result.error.message}`);
  }
  return result.data;
};
