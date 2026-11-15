import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "panels",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/characters/imported", "tests/characters/pages/character-sheet-page.test.ts", "tests/funds/tracking", "tests/funds/page", "tests/funds/purses", "tests/interface/sections/funds-section.test.ts", "tests/imports/layout/guarded-line.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
