import { fileURLToPath } from "node:url";
import { runMutations } from "../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "kind notes",
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  suites: ["tests/kind-notes", "tests/campaign/reading/editor-text.test.ts", "tests/campaign/reading/note-views.test.ts", "tests/views/dialogs/differing-notice.test.ts"],
  limits: { memoryMax: "2G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
