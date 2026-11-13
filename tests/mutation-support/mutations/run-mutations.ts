import { fileURLToPath } from "node:url";
import { runMutations } from "../mutation-runner.ts";

await runMutations({
  name: "support",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/mutation-support"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
