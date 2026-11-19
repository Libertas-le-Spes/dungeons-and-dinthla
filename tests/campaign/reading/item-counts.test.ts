import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { ItemRecord, SessionNote } from "../../../src/campaign/record/campaign";

function sessionOf(lines: string[]): SessionNote {
  return { path: "Pale Moon/Sessions/Session 1.md", number: 1, text: lines.join("\n"), firstLine: 0 };
}

function itemsAfter(lines: string[]): ItemRecord[] {
  return buildCampaign([sessionOf(lines)]).items;
}

function itemAfter(lines: string[]): ItemRecord {
  const [item, ...others] = itemsAfter(lines);
  if (item === undefined || others.length > 0) throw new Error("The lines leave more or fewer than one holding.");
  return item;
}

interface Holding {
  readonly holder: string;
  readonly held: number;
  readonly gone: boolean;
}

function holdingsAfter(lines: string[]): Holding[] {
  const holdings: Holding[] = [];
  for (const item of itemsAfter(lines)) holdings.push({ holder: item.holder, held: item.held, gone: item.gone !== null });
  return holdings;
}

describe("how many of an item are held", () => {
  it("is the count of the line that first gives it, kept apart from its name", () => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x5"]);
    expect([item.name, item.written, item.held, item.gone]).toEqual(["Dagger", "Dagger", 5, null]);
  });

  it("is one for an item given with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Dagger"]).held).toBe(1);
  });

  it("goes down by what a line uses, sells or loses, the item staying held while some are left", () => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x5", "$$ Dagger x2 :used", "$$ Dagger x1 :sold 2gp", "$$ Dagger x1 :lost"]);
    expect([item.held, item.gone]).toEqual([1, null]);
    expect(item.history.map((event) => [event.kind, event.count])).toEqual([["named", 5], ["used", 2], ["sold", 1], ["lost", 1]]);
  });

  it("goes down by one for a use, sale or loss with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Dagger x3", "$$ Dagger :used", "$$ Dagger :sold 5gp"]).held).toBe(1);
  });

  it.each([
    ["the last of them", "$$ Dagger x3 :used"],
    ["more than are held", "$$ Dagger x4 :lost"],
  ])("is gone after a line that takes %s", (_case, line) => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x3", line]);
    expect(item.gone?.source.line).toBe(1);
  });

  it("is gone after a line with no count takes the only one", () => {
    expect(itemAfter(["$ [[Primary Monk]] Dagger", "$$ Dagger :used"]).gone).not.toBeNull();
  });

  it("goes up by the count of another line that gives the same holder more", () => {
    expect(itemAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Primary Monk]] Arrow x10"]).held).toBe(30);
  });

  it("goes up by one for a line that gives the same holder one more with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Primary Monk]] Arrow"]).held).toBe(21);
  });

  it("starts again at the count of a line that brings a gone item back, as the same item", () => {
    const item = itemAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow x20 :lost", "$ [[Mira]] Arrow x4"]);
    expect([item.holder, item.held, item.gone]).toEqual(["Mira", 4, null]);
  });

  it("is the count of a change of hands that is the first line about it", () => {
    expect(itemAfter(["$$ Arrow x12 :changed to [[Mira]]"]).held).toBe(12);
  });

  it("is gone after a counted line that is the first about it, as a line with no count is", () => {
    expect(itemAfter(["$$ Potion of healing x2 :used"]).gone).not.toBeNull();
  });

  it("is one item whether a line writes a count or not", () => {
    const item = itemAfter(["$ [[Primary Monk]] Rope x2", "$$ Rope x1 :used", "$$ Rope :changed to the party"]);
    expect([item.name, item.held, item.holder]).toEqual(["Rope", 1, "the party"]);
  });
});

describe("an item held by more than one", () => {
  it("gives another holder their own count when a $ line names them, leaving the first holder's alone", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Mira]] Arrow"])).toEqual([
      { holder: "Primary Monk", held: 20, gone: false },
      { holder: "Mira", held: 1, gone: false },
    ]);
  });

  it("moves the count a change of hands writes, and leaves the rest", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow x5 :changed to [[Mira]]"])).toEqual([
      { holder: "Primary Monk", held: 15, gone: false },
      { holder: "Mira", held: 5, gone: false },
    ]);
  });

  it("moves one for a change of hands with no count", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow :changed to [[Mira]]"])).toEqual([
      { holder: "Primary Monk", held: 19, gone: false },
      { holder: "Mira", held: 1, gone: false },
    ]);
  });

  it("hands over the whole holding when a change of hands moves them all, keeping one item", () => {
    const item = itemAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow x20 :changed to [[Mira]]"]);
    expect([item.holder, item.held, item.source.line]).toEqual(["Mira", 20, 0]);
  });

  it("joins a moved count to what the receiver already holds", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Mira]] Arrow x2", "$$ Arrow x20 :changed to [[Mira]]"])).toEqual([{ holder: "Mira", held: 22, gone: false }]);
  });

  it.each([
    ["after the change word", "$$ Arrow x2 :used by [[Mira]]"],
    ["after the item's name", "$$ Arrow [[Mira]] x2 :used"],
    ["after the count", "$$ Arrow x2 [[Mira]] :used"],
  ])("takes from the holder a line names %s", (_case, line) => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x15", "$ [[Mira]] Arrow x5", line])).toEqual([
      { holder: "Primary Monk", held: 15, gone: false },
      { holder: "Mira", held: 3, gone: false },
    ]);
  });

  it("takes one from the holder named with no count", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x15", "$ [[Mira]] Arrow x5", "$$ Arrow [[Mira]] :lost"])[1]).toEqual({ holder: "Mira", held: 4, gone: false });
  });

  it("takes from whoever held it first when nobody is named", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x15", "$ [[Mira]] Arrow x5", "$$ Arrow x1 :lost"])).toEqual([
      { holder: "Primary Monk", held: 14, gone: false },
      { holder: "Mira", held: 5, gone: false },
    ]);
  });

  it("takes from whoever held it first when the one named holds none", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x15", "$$ Arrow x1 :sold 1gp to [[Bram]]"])).toEqual([{ holder: "Primary Monk", held: 14, gone: false }]);
  });

  it("takes from the next holder once the first one's are all gone", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x2", "$ [[Mira]] Arrow x5", "$$ Arrow x2 :used", "$$ Arrow x1 :used"])).toEqual([
      { holder: "Primary Monk", held: 2, gone: true },
      { holder: "Mira", held: 4, gone: false },
    ]);
  });

  it("moves from the holder named before the change word", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x15", "$ [[Mira]] Arrow x5", "$$ Arrow x2 [[Mira]] :changed to [[Thessaly]]"])).toEqual([
      { holder: "Primary Monk", held: 15, gone: false },
      { holder: "Mira", held: 3, gone: false },
      { holder: "Thessaly", held: 2, gone: false },
    ]);
  });

  it("hands over exactly what is held when a change of hands writes more", () => {
    expect(holdingsAfter(["$ [[Primary Monk]] Arrow x5", "$$ Arrow x8 :changed to [[Mira]]"])).toEqual([{ holder: "Mira", held: 5, gone: false }]);
  });

  it("keeps a holding as it was when a change of hands names its own holder", () => {
    const item = itemAfter(["$ [[Primary Monk]] Arrow x5", "$$ Arrow x5 :changed to [[Primary Monk]]"]);
    expect([item.holder, item.held, item.source.line]).toEqual(["Primary Monk", 5, 0]);
  });

  it("counts the party written with no link and as the party as one holder", () => {
    expect(holdingsAfter(["$ Rope x2", "$$ Rope :changed to the party"])).toEqual([{ holder: "", held: 2, gone: false }]);
  });

  it("counts a holder linked in other capitals as the same holder", () => {
    expect(holdingsAfter(["$ [[Mira]] Arrow x2", "$ [[mira]] Arrow"])).toEqual([{ holder: "Mira", held: 3, gone: false }]);
  });

  it("keeps a link at the end of a name nobody holds as part of the name", () => {
    expect(itemAfter(["$$ Dagger of [[Vess]] :lost"]).name).toBe("Dagger of Vess");
  });

  it("keeps one history of every line about the item, shared by its holders", () => {
    const [first, second] = itemsAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow x5 :changed to [[Mira]]"]);
    expect(first!.history).toBe(second!.history);
    expect(first!.history.map((event) => event.source.line)).toEqual([0, 1]);
  });
});
