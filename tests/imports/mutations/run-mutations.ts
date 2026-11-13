import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "imports",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/imports", "tests/build/inner-folders.test.ts", "tests/build/note-folders.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
