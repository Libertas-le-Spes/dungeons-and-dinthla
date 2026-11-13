import { runMutations } from "../../../mutation-support/mutation-runner.ts";

runMutations({
  name: "screen-fences",
  root: new URL("../../../..", import.meta.url).pathname,
  suites: ["tests/fence/source-checks/source-allowances.test.ts", "tests/pdf/source", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
