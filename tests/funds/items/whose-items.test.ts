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
  ["$$ Spyglass :sold 20 gp to [[Mira]]", "$$ Map :lost"],
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

  it.each(["$ Rope for [[Zed]] and [[Mira]] to share", "$ [[Zed]] Rope given to [[Mira]]", "$ [[Innkeeper]] gave [[Mira]] a sword"])("gives a line whose holder is another to the party, though it links his character too, as in %s", (line) => {
    const { mine, party } = whoseItems({ campaign: campaignOf([line]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(0);
    expect(party.heldCount).toBe(1);
  });

  it("gives a line whose first link is his character to him", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ Flame Tongue longsword found by [[Mira]]"]), ownNames: ["Mira"] });
    expect(mine.heldCount).toBe(1);
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

  it("keeps his character's own and gives the party's own to the party when a later line gives the party one", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(["$ [[Mira]] Rope", "$ Rope"]), ownNames: ["Mira"] });
    expect([mine.heldCount, party.heldCount]).toEqual([1, 1]);
  });

  it.each([
    ["sold", "$$ Rope :sold 5 gp to [[Zed]]"],
    ["used", "$$ Rope :used"],
    ["lost", "$$ Rope :lost"],
  ])("keeps an item his character held under Mine once it is %s, whatever the gone line links", (_kind, goneLine) => {
    const { mine, party } = whoseItems({ campaign: campaignOf(["$ [[Mira]] Rope"], [goneLine]), ownNames: ["Mira"] });
    expect(mine.gone.map((item) => item.name)).toEqual(["Rope"]);
    expect(party.gone).toEqual([]);
  });

  it("gives an item another held to the party once it is gone, though the gone line links his character", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(["$ [[Zed]] Rope"], ["$$ Rope :sold 5 gp to [[Mira]]"]), ownNames: ["Mira"] });
    expect(mine.gone).toEqual([]);
    expect(party.gone.map((item) => item.name)).toEqual(["Rope"]);
  });

  it("moves an item to the party when his character gives it to the party, and to him when he is given it", () => {
    const given = whoseItems({ campaign: campaignOf(["$ [[Mira]] Rope", "$$ Rope :changed to the party"]), ownNames: ["Mira"] });
    const received = whoseItems({ campaign: campaignOf(["$ Rope", "$$ Rope :changed to [[Mira]]"]), ownNames: ["Mira"] });
    expect([given.mine.heldCount, given.party.heldCount]).toEqual([0, 1]);
    expect([received.mine.heldCount, received.party.heldCount]).toEqual([1, 0]);
  });

  it("counts his character written as plain text as his, as the same holder as the link", () => {
    const { mine } = whoseItems({ campaign: campaignOf(["$ Rope", "$$ Rope :changed to Mira"]), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["Mira", ["Rope"]]]);
  });

  it("puts each holder's share of a split item on their side", () => {
    const { mine, party } = whoseItems({ campaign: campaignOf(["$ [[Mira]] Arrow x20", "$$ Arrow x5 :changed to [[Zed]]"]), ownNames: ["Mira"] });
    expect([heldOf(mine), heldOf(party)]).toEqual([[["Mira", ["Arrow"]]], [["Zed", ["Arrow"]]]]);
  });
});
