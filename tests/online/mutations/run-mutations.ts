import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "online",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/online", "tests/imports/dialog/online-import.test.ts", "tests/imports/dialog/online-dialog.test.ts", "tests/imports/dialog/dialog-parts.test.ts", "tests/obsidian/online/obsidian-beyond-call.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
