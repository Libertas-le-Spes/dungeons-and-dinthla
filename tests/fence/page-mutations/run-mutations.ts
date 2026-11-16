import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "page-fence",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/fence/sample-checks/page-access.test.ts", "tests/fence/source-checks"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
