import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { MOST_TEST_WORKERS, WORKER_HEAP_LIMIT_MB } from "./tests/setup/memory-limits.ts";

export default defineConfig({
  resolve: {
    alias: {
      obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    maxWorkers: MOST_TEST_WORKERS,
    setupFiles: ["tests/setup/heap-guard.ts"],
    execArgv: [`--max-old-space-size=${WORKER_HEAP_LIMIT_MB}`, "--expose-gc"],
  },
});
