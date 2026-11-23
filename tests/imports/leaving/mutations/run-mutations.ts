import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "leaving",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: [
    "tests/imports/leaving",
    "tests/imports/dialog/dialog-parts.test.ts",
    "tests/imports/note/writing/import-writer.test.ts",
    "tests/characters/editing/character-files.test.ts",
    "tests/characters/pages/character-gallery-standing.test.ts",
    "tests/characters/pages/character-sheet-page.test.ts",
    "tests/characters/pages/cast-page.test.ts",
    "tests/characters/reading/character-notes.test.ts",
    "tests/build/leaving-folders.test.ts",
    "tests/fence/source-checks",
  ],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
