import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "references",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/references", "tests/notes/parts/link.test.ts", "tests/funds/item-notes"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
