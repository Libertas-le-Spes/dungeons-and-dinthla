import { describe, expect, it } from "vitest";
import { namesOnLine } from "../../src/references/line-names";

describe("namesOnLine", () => {
  it("reads a link after from: on a quest as a character", () => {
    expect(namesOnLine("! Find the caravan, from: [[Lady Vess]]")).toEqual([{ name: "Lady Vess", kind: "character" }]);
  });

  it("reads the holder link of a $ item line as a character and the rest as no kind", () => {
    expect(namesOnLine("$ [[Mira]] Silvered lantern from [[Old Mill]]")).toEqual([
      { name: "Mira", kind: "character" },
      { name: "Old Mill", kind: null },
    ]);
  });

  it("reads an at-sign link as a place", () => {
    expect(namesOnLine("? Who hid the key at @[[Old Mill]]")).toEqual([{ name: "Old Mill", kind: "place" }]);
  });

  it("reads a plain link as no kind", () => {
    expect(namesOnLine("? Who sent [[Lady Vess]] to the mill")).toEqual([{ name: "Lady Vess", kind: null }]);
  });

  it("lets a place link win over a from: link to the same name", () => {
    expect(namesOnLine("! Reach the pass, from: [[Grey Pass]] and @[[Grey Pass]]")).toEqual([{ name: "Grey Pass", kind: "place" }]);
  });

  it("reads only the first link after from: as the giver", () => {
    expect(namesOnLine("! Find the caravan, from: [[Lady Vess]] and [[Baka]]")).toEqual([
      { name: "Lady Vess", kind: "character" },
      { name: "Baka", kind: null },
    ]);
  });

  it("gives no kind to the holder of a $$ line", () => {
    expect(namesOnLine("$$ Silvered lantern :changed to [[Mira]]")).toEqual([{ name: "Mira", kind: null }]);
  });

  it("gives no kind to a from: link on a follow-up line", () => {
    expect(namesOnLine("!+ Find the caravan: from: [[Lady Vess]]")).toEqual([{ name: "Lady Vess", kind: null }]);
  });

  it("gives no kind to a coin line's link, since coin has no holder", () => {
    expect(namesOnLine("$ [[Thessaly]] +30 gp share")).toEqual([{ name: "Thessaly", kind: null }]);
  });

  it("lists a name once when a line links it twice, by the note it leads to", () => {
    expect(namesOnLine("? Is [[Mira]] or [[Mira|the elf]] at the mill")).toEqual([{ name: "Mira", kind: null }]);
  });

  it("gives no kind to an empty link on an item line", () => {
    expect(namesOnLine("$ Rope [[ ]]")).toEqual([{ name: "", kind: null }]);
  });

  it("lists nothing for a line with no link", () => {
    expect(namesOnLine("? Who sent the letter")).toEqual([]);
  });
});
