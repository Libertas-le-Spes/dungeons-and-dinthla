import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "pdf",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/pdf", "tests/build/inner-folders.test.ts", "tests/fence/source-checks/source-allowances.test.ts"],
  limits: { memoryMax: "4G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
