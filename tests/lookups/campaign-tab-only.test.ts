import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SOURCE_FOLDER = fileURLToPath(new URL("../../src/", import.meta.url));

function sourceFiles(): string[] {
  const all = readdirSync(SOURCE_FOLDER, { recursive: true, encoding: "utf8" });
  return all.filter((path) => path.endsWith(".ts"));
}

function offersEditorSuggestions(path: string): boolean {
  return readFileSync(`${SOURCE_FOLDER}${path}`, "utf8").includes("EditorSuggest");
}

describe("lookups", () => {
  it("are offered only in the campaign tab's notes box, never in Obsidian's own editor", () => {
    expect(sourceFiles().filter(offersEditorSuggestions)).toEqual([]);
  });
});
