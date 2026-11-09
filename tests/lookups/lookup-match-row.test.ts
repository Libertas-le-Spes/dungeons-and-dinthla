import { describe, expect, it } from "vitest";
import type { LookupMatch } from "../../src/lookups/lookup";
import { addLookupMatch } from "../../src/lookups/lookup-match-row";
import { obsidianDocument } from "../views/obsidian-dom";

const SOURCE = { path: "Pale Moon/Sessions/Session 1.md", line: 0 };

function rowOf(match: LookupMatch, keywords: string[]): HTMLElement {
  const el = obsidianDocument().createElement("div");
  addLookupMatch(el, match, keywords);
  return el;
}

describe("addLookupMatch", () => {
  it("shows an item with its marker, the typed words marked, and its holder", () => {
    const row = rowOf({ kind: "item", text: "Silvered lantern", holder: "Mira", source: SOURCE }, ["lan"]);
    expect(row.querySelector(".dd-marker-ledger")?.textContent).toBe("$");
    expect(row.querySelector("mark")?.textContent).toBe("lan");
    expect(row.querySelector(".dd-lookup-text")?.textContent).toBe("Silvered lantern");
    expect(row.querySelector(".dd-lookup-holder")?.textContent).toBe("Mira");
  });

  it("shows the party as the holder of an item nobody holds", () => {
    const row = rowOf({ kind: "item", text: "Rope", holder: "", source: SOURCE }, ["rope"]);
    expect(row.querySelector(".dd-lookup-holder")?.textContent).toBe("The party");
  });

  it("shows a question or quest without a holder", () => {
    for (const kind of ["question", "quest"] as const) {
      const row = rowOf({ kind, text: "Who sent it", holder: "", source: SOURCE }, ["who"]);
      expect(row.querySelector(".dd-lookup-holder"), kind).toBeNull();
    }
  });
});
