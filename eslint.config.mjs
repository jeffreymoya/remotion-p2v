import { config } from "@remotion/eslint-config-flat";

// Exclude auto-generated Prisma client/output from lint to avoid noisy errors.
export default [
  ...config,
  {
    ignores: ["src/generated/**"],
  },
];
