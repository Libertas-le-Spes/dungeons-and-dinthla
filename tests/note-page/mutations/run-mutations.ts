import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "note page",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/note-page", "tests/interface/sections/note-section.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
