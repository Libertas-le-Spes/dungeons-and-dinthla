import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "opening",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/views/opening", "tests/session-notes/page/session-notes-page.test.ts", "tests/obsidian/interface/view/campaign-view.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
