import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "screens",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/characters", "tests/imports/dialog", "tests/imports/layout", "tests/beyond/sheet/from-pdf", "tests/obsidian/views/mount/file-pick.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
