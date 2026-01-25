import { config } from "@remotion/eslint-config-flat";

// Exclude auto-generated Prisma client/output from lint to avoid noisy errors.
export default [
  ...config,
  {
    ignores: ["src/generated/**"],
  },
  {
    // Relax Remotion perf warnings for UI pages to keep lint baseline clean.
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "remotion/**/*.{ts,tsx}"],
    rules: {
      "@remotion/slow-css-property": "off",
      "@remotion/non-pure-animation": "off",
    },
  },
];
