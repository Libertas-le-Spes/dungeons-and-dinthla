import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "sheet",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/beyond/sheet", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "4G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
