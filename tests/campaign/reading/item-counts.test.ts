import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { ItemRecord, SessionNote } from "../../../src/campaign/record/campaign";

function sessionOf(lines: string[]): SessionNote {
  return { path: "Pale Moon/Sessions/Session 1.md", number: 1, text: lines.join("\n"), firstLine: 0 };
}

function itemAfter(lines: string[]): ItemRecord {
  const [item, ...others] = buildCampaign([sessionOf(lines)]).items;
  if (item === undefined || others.length > 0) throw new Error("The lines name more or fewer than one item.");
  return item;
}

describe("how many of an item are held", () => {
  it("is the count of the line that first gives it, kept apart from its name", () => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x5"]);
    expect([item.name, item.written, item.held, item.gone]).toEqual(["Dagger", "Dagger", 5, null]);
  });

  it("is not known for an item given with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Dagger"]).held).toBeNull();
  });

  it("goes down by what a line uses, sells or loses, the item staying held while some are left", () => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x5", "$$ Dagger x2 :used", "$$ Dagger x1 :sold 2gp", "$$ Dagger x1 :lost"]);
    expect([item.held, item.gone]).toEqual([1, null]);
    expect(item.history.map((event) => [event.kind, event.count])).toEqual([["named", 5], ["used", 2], ["sold", 1], ["lost", 1]]);
  });

  it.each([
    ["the last of them", "$$ Dagger x3 :used"],
    ["more than are held", "$$ Dagger x4 :lost"],
    ["the item with no count", "$$ Dagger :sold 5gp"],
  ])("is gone after a line that takes %s", (_case, line) => {
    const item = itemAfter(["$ [[Primary Monk]] Dagger x3", line]);
    expect(item.gone?.source.line).toBe(1);
  });

  it("is gone after a counted line takes an item held with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Dagger", "$$ Dagger x1 :used"]).gone).not.toBeNull();
  });

  it("goes up by the count of another line that gives more", () => {
    expect(itemAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Primary Monk]] Arrow x10"]).held).toBe(30);
  });

  it("stays as it was when another line names it with no count", () => {
    expect(itemAfter(["$ [[Primary Monk]] Arrow x20", "$ [[Mira]] Arrow"]).held).toBe(20);
  });

  it("starts again at the count of a line that brings a gone item back", () => {
    expect(itemAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow :lost", "$ [[Mira]] Arrow x4"]).held).toBe(4);
  });

  it("keeps its count when it changes hands", () => {
    const item = itemAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow :changed to [[Mira]]"]);
    expect([item.held, item.holder]).toEqual([20, "Mira"]);
  });

  it("moves them all, keeping the count, when a change of hands writes a count", () => {
    const item = itemAfter(["$ [[Primary Monk]] Arrow x20", "$$ Arrow x5 :changed to [[Mira]]"]);
    expect([item.held, item.holder, item.gone]).toEqual([20, "Mira", null]);
  });

  it("is the count of a change of hands that is the first line about it", () => {
    expect(itemAfter(["$$ Arrow x12 :changed to [[Mira]]"]).held).toBe(12);
  });

  it("is gone after a counted line that is the first about it, as a line with no count is", () => {
    expect(itemAfter(["$$ Potion of healing x2 :used"]).gone).not.toBeNull();
  });

  it("is one item whether a line writes a count or not", () => {
    const item = itemAfter(["$ [[Primary Monk]] Rope x2", "$$ Rope x1 :used", "$$ Rope :changed to the party"]);
    expect([item.name, item.held]).toEqual(["Rope", 1]);
  });
});
