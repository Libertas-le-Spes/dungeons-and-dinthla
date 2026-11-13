import { runMutations } from "../../../mutation-support/mutation-runner.ts";

runMutations({
  name: "screens",
  root: new URL("../../../..", import.meta.url).pathname,
  suites: ["tests/characters", "tests/imports/dialog", "tests/imports/layout", "tests/beyond/sheet/from-pdf"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
