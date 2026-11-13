import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "panels",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/characters", "tests/funds", "tests/interface/sections"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
