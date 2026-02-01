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
  {
    // Ban relative paths in vi.mock() — they resolve from the test file's
    // directory, not the component's, causing silent mock misses and OOM hangs.
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.object.name="vi"][callee.property.name="mock"] > Literal[value=/^[.][.]/]',
          message:
            "Use absolute @/ paths in vi.mock() — relative paths resolve from the test file directory, not the component directory, which silently breaks mocks.",
        },
      ],
    },
  },
];
