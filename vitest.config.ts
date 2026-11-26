import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { MOST_TEST_WORKERS, WORKER_HEAP_LIMIT_MB } from "./tests/setup/memory-limits.ts";

const CORE_TESTS = ["tests/end-to-end/**/*.test.ts", "tests/plugin/**/*.test.ts"];

export default defineConfig({
  test: {
    passWithNoTests: true,
    maxWorkers: MOST_TEST_WORKERS,
    setupFiles: ["tests/setup/heap-guard.ts"],
    execArgv: [`--max-old-space-size=${WORKER_HEAP_LIMIT_MB}`, "--expose-gc"],
    projects: [
      {
        extends: true,
        test: { name: "core", include: CORE_TESTS },
      },
      {
        extends: true,
        resolve: {
          alias: {
            obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
          },
        },
        test: { name: "obsidian", include: ["tests/**/*.test.ts"], exclude: CORE_TESTS },
      },
    ],
  },
});
