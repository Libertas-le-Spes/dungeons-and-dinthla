import { runMutations } from "../../mutation-support/mutation-runner.ts";

runMutations({
  name: "imports",
  root: new URL("../../..", import.meta.url).pathname,
  suites: ["tests/imports", "tests/build/inner-folders.test.ts", "tests/build/note-folders.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
