import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { summariseItems, type ItemSummary } from "../../../src/funds/items/item-groups";
import { whoseItems } from "../../../src/funds/items/whose-items";

function summaryOf(...sessions: string[][]): ItemSummary {
  return summariseItems(
    buildCampaign(
      sessions.map((lines, index) => ({
        path: `Pale Moon/Sessions/Session ${index + 1}.md`,
        number: index + 1,
        firstLine: 0,
        text: lines.join("\n"),
      })),
    ),
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
    const { mine, party } = whoseItems({ summary: summaryOf(...SESSIONS), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["Mira", ["Flame Tongue"]]]);
    expect(heldOf(party)).toEqual([
      ["Zed", ["Rope"]],
      ["", ["Potion of healing"]],
    ]);
  });

  it("counts what each side holds", () => {
    const { mine, party } = whoseItems({ summary: summaryOf(...SESSIONS), ownNames: ["Mira"] });
    expect([mine.heldCount, party.heldCount]).toEqual([1, 2]);
  });

  it("gives a gone item to the side whose holder it was", () => {
    const { mine, party } = whoseItems({ summary: summaryOf(...SESSIONS), ownNames: ["Mira"] });
    expect(mine.gone.map((item) => item.name)).toEqual(["Spyglass"]);
    expect(party.gone.map((item) => item.name)).toEqual(["Map"]);
  });

  it("matches his character's name whatever the capitals", () => {
    const { mine } = whoseItems({ summary: summaryOf(["$ [[mira]] Rope"]), ownNames: ["Mira"] });
    expect(heldOf(mine)).toEqual([["mira", ["Rope"]]]);
  });

  it("gives items to several characters of his", () => {
    const { mine, party } = whoseItems({ summary: summaryOf(...SESSIONS), ownNames: ["Mira", "Zed"] });
    expect(heldOf(mine)).toEqual([
      ["Mira", ["Flame Tongue"]],
      ["Zed", ["Rope"]],
    ]);
    expect(heldOf(party)).toEqual([["", ["Potion of healing"]]]);
  });

  it("gives everything to the party when no character is his", () => {
    const { mine, party } = whoseItems({ summary: summaryOf(...SESSIONS), ownNames: [] });
    expect(mine).toEqual({ groups: [], gone: [], heldCount: 0 });
    expect(party.heldCount).toBe(3);
  });

  it("never gives the party's own to him", () => {
    const { mine } = whoseItems({ summary: summaryOf(["$ Potion of healing"]), ownNames: ["the party"] });
    expect(mine.heldCount).toBe(0);
  });
});
