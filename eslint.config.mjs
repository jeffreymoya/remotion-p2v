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
  {
    // Encourage design tokens over hardcoded slate colors in new UI code.
    // Existing violations warn (not error) so they can be fixed incrementally.
    // Token mapping: bg-background, bg-card, bg-input, bg-secondary, bg-accent,
    //   text-foreground, text-muted-foreground, border-border. See globals.css.
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    ignores: ["**/*.test.tsx", "**/__tests__/**"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'Literal[value=/(bg|text|border)-slate-/]',
          message:
            "Use design tokens instead of hardcoded slate colors. Common mappings: bg-slate-950→bg-background, bg-slate-900→bg-card/bg-input, bg-slate-800→bg-secondary, text-slate-50→text-foreground, text-slate-400→text-muted-foreground, border-slate-800→border-border. See globals.css for all tokens.",
        },
      ],
    },
  },
];
