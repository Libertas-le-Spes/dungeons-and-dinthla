import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "screen-fences",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/fence/source-checks/source-allowances.test.ts", "tests/pdf/source", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
