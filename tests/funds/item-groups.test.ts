import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { summariseItems } from "../../src/funds/item-groups";

function summaryOf(...sessions: string[][]) {
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

function groupsOf(summary: ReturnType<typeof summaryOf>): [string, string[]][] {
  return summary.groups.map(({ holder, items }) => [holder, items.map((item) => item.name)]);
}

describe("summariseItems", () => {
  it("groups held items by holder in name order, the party's own last", () => {
    const summary = summaryOf(["$ [[Mira]] Flame Tongue", "$ Potion of healing", "$ [[Brother Aldric]] Holy symbol", "$ [[Mira]] Silvered lantern"]);
    expect(groupsOf(summary)).toEqual([
      ["Brother Aldric", ["Holy symbol"]],
      ["Mira", ["Flame Tongue", "Silvered lantern"]],
      ["", ["Potion of healing"]],
    ]);
    expect(summary.heldCount).toBe(4);
  });

  it("puts one holder under one heading however the link is written", () => {
    const summary = summaryOf(["$ [[Mira]] Lantern", "$ [[mira]] Rope", "$ [[Characters/Mira]] Cloak", "$ [[Mira|her]] Map"]);
    expect(groupsOf(summary)).toEqual([["Mira", ["Lantern", "Rope", "Cloak", "Map"]]]);
  });

  it("counts an item changed to the party as the party's own", () => {
    const summary = summaryOf(["$ [[Mira]] Coin purse", "$$ Coin purse :changed to the party", "$ [[Zed]] Rope"]);
    expect(groupsOf(summary)).toEqual([
      ["Zed", ["Rope"]],
      ["", ["Coin purse"]],
    ]);
  });

  it("lists gone items by when they went, most recent first", () => {
    const summary = summaryOf(["$ Rope", "$ Spyglass"], ["$$ Spyglass :sold 20 gp"], ["$$ Rope :used"]);
    expect(summary.gone.map((item) => [item.name, item.gone?.kind])).toEqual([
      ["Rope", "used"],
      ["Spyglass", "sold"],
    ]);
  });

  it("orders items gone in one session by their lines, latest first", () => {
    const summary = summaryOf(["$ Rope", "$ Spyglass", "$$ Spyglass :lost", "$$ Rope :used"]);
    expect(summary.gone.map((item) => item.name)).toEqual(["Rope", "Spyglass"]);
  });

  it("summarises a campaign with no items as empty", () => {
    expect(summaryOf(["$ 5 gp"])).toEqual({ groups: [], gone: [], heldCount: 0 });
  });
});
