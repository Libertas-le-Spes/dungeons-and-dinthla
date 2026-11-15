import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "asking",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/references/asking"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
