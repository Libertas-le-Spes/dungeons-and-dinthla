import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "panels",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/characters/imported", "tests/characters/pages/character-sheet-page.test.ts", "tests/funds/tracking", "tests/funds/page", "tests/funds/purses", "tests/obsidian/interface/sections/funds-section.test.ts", "tests/imports/layout/guarded-line.test.ts", "tests/imports/layout/character-escapes.test.ts", "tests/funds/items", "tests/campaign/reading/item-counts.test.ts", "tests/notes/parts/item-count.test.ts", "tests/notes/reading", "tests/funds/item-notes", "tests/dashboard", "tests/campaign/reading/build-campaign.test.ts", "tests/funds/items/item-named.test.ts", "tests/funds/items/whose-items.test.ts", "tests/characters/retiring", "tests/settings/saved/plugin-settings.test.ts"],
  limits: { memoryMax: "3G", seconds: 300 },
  mutations: new URL("./mutations.json", import.meta.url),
});
