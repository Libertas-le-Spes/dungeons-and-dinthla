import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "pending",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/views/pending"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
