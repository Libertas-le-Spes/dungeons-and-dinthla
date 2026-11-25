import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "reading",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/reading", "tests/obsidian/reading", "tests/obsidian/editor", "tests/campaign/paths/campaign-folders.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
