import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { ItemRecord, SessionNote } from "../../../src/campaign/record/campaign";
import { itemNoteLines } from "../../../src/funds/item-notes/item-note-lines";

function session(number: number, lines: string[]): SessionNote {
  return { path: `Pale Moon/Sessions/Session ${number}.md`, number, text: lines.join("\n"), firstLine: 0 };
}

const sessions = [
  session(3, ["$$ Silvered lantern :changed to [[Baka]]", "$ Rope"]),
  session(1, ["We began.", "$ [[Mira]] Silvered lantern", "$ Rope"]),
  session(2, ["- $$ Silvered lantern :sold 30gp", "We rested."]),
];

function itemNamed(name: string): ItemRecord {
  const item = buildCampaign(sessions).items.find((candidate) => candidate.name === name);
  if (item === undefined) throw new Error(`No item named ${name}`);
  return item;
}

describe("itemNoteLines", () => {
  it("lists every line that names the item, in session order, as written without the bullet", () => {
    expect(itemNoteLines(itemNamed("Silvered lantern"), sessions)).toEqual(["$ [[Mira]] Silvered lantern", "$$ Silvered lantern :sold 30gp", "$$ Silvered lantern :changed to [[Baka]]"]);
  });

  it("leaves out the lines of other items", () => {
    expect(itemNoteLines(itemNamed("Rope"), sessions)).toEqual(["$ Rope", "$ Rope"]);
  });
});
