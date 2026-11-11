import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/build-campaign";
import { summariseItems } from "../../../src/funds/items/item-groups";

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

  it("lists gone items by the session they went in, latest first, not by when they were named", () => {
    const summary = summaryOf(["$ Rope", "$ Spyglass"], ["$$ Rope :used"], ["$$ Spyglass :sold 20 gp"]);
    expect(summary.gone.map((item) => item.name)).toEqual(["Spyglass", "Rope"]);
  });

  it("compares session numbers as numbers", () => {
    const sessions = Array.from({ length: 10 }, (): string[] => []);
    sessions[0] = ["$ Rope", "$ Spyglass"];
    sessions[8] = ["$$ Spyglass :lost"];
    sessions[9] = ["$$ Rope :used"];
    expect(summaryOf(...sessions).gone.map((item) => item.name)).toEqual(["Rope", "Spyglass"]);
  });

  it("orders items gone in one session by their lines, latest first", () => {
    const summary = summaryOf(["$ Rope", "$ Spyglass", "$$ Rope :used", "$$ Spyglass :lost"]);
    expect(summary.gone.map((item) => item.name)).toEqual(["Spyglass", "Rope"]);
  });

  it("reads a holder linked with .md as the same holder", () => {
    expect(groupsOf(summaryOf(["$ [[Mira]] Lantern", "$ [[Mira.md]] Rope"]))).toEqual([["Mira", ["Lantern", "Rope"]]]);
  });

  it("summarises a campaign with no items as empty", () => {
    expect(summaryOf(["$ 5 gp"])).toEqual({ groups: [], gone: [], heldCount: 0 });
  });
});
