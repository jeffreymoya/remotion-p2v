import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      // Existing node:test files (to be migrated in Phase 2.9)
      "src/lib/__tests__/**",
      "src/lib/storyflow/__tests__/**",
      "src/lib/services/ai/__tests__/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/test/**",
        "src/generated/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
