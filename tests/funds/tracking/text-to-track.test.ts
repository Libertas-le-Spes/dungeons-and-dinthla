import { describe, expect, it } from "vitest";
import type { ItemRecord } from "../../../src/campaign/record/campaign";
import { guardedLineOf } from "../../../src/imports/layout/guarded-line";
import { textToTrack } from "../../../src/funds/tracking/text-to-track";
import { unlink } from "../../../src/notes/parts/link";

function pageItem(name: string, written: string): ItemRecord {
  return { name, written, holder: "Secondary", holderLinked: true, links: ["Secondary"], source: { path: "Pale Moon/Sessions/Session 1.md", line: 0 }, history: [], gone: null };
}

const ACTIVE_ON_THE_PAGE = [
  "Rope #loot",
  "Rope [weight:: 5]",
  "![[map.png]]",
  "Rope [[Evil Note]]",
  "Rope ==x==",
  "Rope <b>",
  "Rope `code`",
  "Rope $x$",
  "Rope ^[note]",
  "[Rope](note)",
  "![Rope](https:/x)",
  "[[Rope|Coil]]",
  "[[Rope#Top]]",
  "[[Rope^top]]",
  "[[Rope_x]]",
  "1. Rope",
  "? Rope",
  "Potion: Healing",
];

const INERT_ON_THE_PAGE = ["Rope", "Rope (50 ft) \\*silk\\*", "[[Rope]]", "[[Silk Rope]]"];

describe("the text written when an item is tracked", () => {
  it.each(ACTIVE_ON_THE_PAGE)("refuses the page's own text %s, which isn't inert", (written) => {
    expect(textToTrack([pageItem("Rope", written)], "Rope")).toBeNull();
  });

  it.each(INERT_ON_THE_PAGE)("takes the page's own text %s, which is inert", (written) => {
    expect(textToTrack([pageItem("Rope", written)], "Rope")).toBe(written);
  });

  it.each(ACTIVE_ON_THE_PAGE)("refuses %s written at the table, matched by the line the import escaped", (written) => {
    expect(textToTrack([pageItem(written, written)], guardedLineOf(unlink(written)))).toBeNull();
  });

  it("takes the import's own line when the page has no item of that name", () => {
    expect(textToTrack([pageItem("Dagger", "Dagger #loot")], "Rope \\#loot")).toBe("Rope \\#loot");
  });
});
