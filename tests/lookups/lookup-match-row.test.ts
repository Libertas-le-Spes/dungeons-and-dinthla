import { describe, expect, it } from "vitest";
import type { LookupMatch } from "../../src/lookups/lookup";
import { lookupMatchParts } from "../../src/lookups/lookup-match-row";
import { mountTree } from "../../src/obsidian/views/mount/mount-tree";
import { Div } from "../../src/views/elements/kinds/containers";
import { obsidianDocument } from "../stubs/obsidian-dom";

const SOURCE = { path: "Pale Moon/Sessions/Session 1.md", line: 0 };

function rowOf(match: LookupMatch, keywords: string[]): HTMLElement {
  const el = obsidianDocument().createElement("div");
  mountTree(new Div({}, lookupMatchParts(match, keywords)), el);
  return el;
}

describe("lookupMatchParts", () => {
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

  it.each(["question", "quest"] as const)("shows a %s without a holder", (kind) => {
    const row = rowOf({ kind, text: "Who sent it", holder: "", source: SOURCE }, ["who"]);
    expect(row.querySelector(".dd-lookup-holder")).toBeNull();
  });
});
