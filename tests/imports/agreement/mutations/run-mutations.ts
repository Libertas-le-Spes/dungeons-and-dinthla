import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "agreement",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/imports/agreement", "tests/welcome", "tests/obsidian/interface/sections", "tests/main.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
