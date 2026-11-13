import { runMutations } from "../mutation-runner.ts";

runMutations({
  name: "support",
  root: new URL("../../..", import.meta.url).pathname,
  suites: ["tests/mutation-support"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
