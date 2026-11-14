import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "network-fence",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/fence/sample-checks/network-access.test.ts", "tests/fence/source-checks", "tests/build/network-code.test.ts", "tests/build/release-network-check.test.ts", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
