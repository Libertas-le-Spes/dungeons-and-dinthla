import { runMutations } from "../../../mutation-support/mutation-runner.ts";

runMutations({
  name: "sheet",
  root: new URL("../../../..", import.meta.url).pathname,
  suites: ["tests/beyond/sheet", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "4G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
