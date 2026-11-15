import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { Campaign } from "../../../src/campaign/record/campaign";
import type { ItemSummary } from "../../../src/funds/items/item-groups";
import { whoseItems } from "../../../src/funds/items/whose-items";

function campaignOf(...sessions: string[][]): Campaign {
  return buildCampaign(
    sessions.map((lines, index) => ({
      path: `Pale Moon/Sessions/Session ${index + 1}.md`,
      number: index + 1,
      firstLine: 0,
      text: lines.join("\n"),
    })),
  );
}

function heldOf(summary: ItemSummary): [string, string[]][] {
  return summary.groups.map(({ holder, items }) => [holder, items.map((item) => item.name)]);
}

const SESSIONS = [
  ["$ [[Mira]] Flame Tongue", "$ [[Zed]] Rope", "$ Potion of healing", "$ [[Mira]] Spyglass", "$ [[Zed]] Map"],
  ["$$ Spyglass :sold 20 gp", "$$ Map :lost"],
];

describe("whoseItems", () => {
  it("gives the items held by his character to him, and every other holder's, the party's own too, to the party", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(...SESSIONS), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["Mira", ["Flame Tongue"]]]);
    expect(heldOf(party)).toEqual([
      ["Zed", ["Rope"]],
      ["", ["Potion of healing"]],
    ]);
  });

  it("counts what each side holds", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(...SESSIONS), ownNames: ["Mira"] });
    expect([mine.heldCount, party.heldCount]).toEqual([1, 2]);
  });

  it("gives a gone item to the side whose holder it was", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(...SESSIONS), ownNames: ["Mira"] });
    expect(mine.gone.map((item) => item.name)).toEqual(["Spyglass"]);
    expect(party.gone.map((item) => item.name)).toEqual(["Map"]);
  });

  it("matches his character's name whatever the capitals", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ [[mira]] Rope"]), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["mira", ["Rope"]]]);
  });

  it.each(["[[Mira|the Fox]]", "[[Mira#Backstory]]", "[[Characters/Mira|the Fox]]", "[[Mira.md]]"])("keeps %s his character's, which the reader already reduces to the link's target", (holder) => {
    const { mine, party } = whoseItems({ campaign: campaignOf([`$ ${holder} Rope`]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(1);
    expect(party.heldCount).toBe(0);
  });

  it("gives items to several characters of his", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(...SESSIONS), ownNames: ["Mira", "Zed"] });
    expect(heldOf(mine)).toEqual([
      ["Mira", ["Flame Tongue"]],
      ["Zed", ["Rope"]],
    ]);
    expect(heldOf(party)).toEqual([["", ["Potion of healing"]]]);
  });

  it("gives everything to the party when no character is his", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(...SESSIONS), ownNames: [] });
    expect(mine).toEqual({ groups: [], gone: [], heldCount: 0 });
    expect(party.heldCount).toBe(3);
  });

  it("never gives the party's own to him", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ Potion of healing"]), ownNames: ["the party"] });
    expect(mine.heldCount).toBe(0);
  });

  it.each(["$ Flame Tongue longsword found by [[Mira]]", "$ Rope for [[Zed]] and [[Mira]] to share", "$ [[Zed]] Rope given to [[Mira]]"])("gives a line to him when his character's link is anywhere on it, as in %s", (line) => {
    const { mine, party } = whoseItems({ campaign: campaignOf([line]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(1);
    expect(party.heldCount).toBe(0);
  });

  it("shows an item given to his character under his character's name", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ [[Innkeeper]] gave [[Mira]] a sword"]), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["Mira", ["gave Mira a sword"]]]);
  });

  it("follows the link of the line that last gave the item a holder", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(["$ [[Mira]] Rope", "$$ Rope :changed to [[Zed]]"]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(0);
    expect(heldOf(party)).toEqual([["Zed", ["Rope"]]]);
  });

  it("follows a change that links his character after the item's name", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ [[Zed]] Rope", "$$ Rope :changed to [[Mira]]"]), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["Mira", ["Rope"]]]);
  });

  it("keeps the links of the earlier line when a later one names no link", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ [[Mira]] Rope", "$ Rope"]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(1);
  });
});
