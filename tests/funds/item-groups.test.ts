import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { summariseItems } from "../../src/funds/item-groups";

function summaryOf(lines: string[]) {
  return summariseItems(buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]));
}

describe("summariseItems", () => {
  const summary = summaryOf([
    "$ [[Mira]] Flame Tongue",
    "$ Potion of healing",
    "$ [[Brother Aldric]] Holy symbol",
    "$ [[Mira]] Silvered lantern",
    "$ Rope",
    "$$ Rope :used",
    "$ Spyglass",
    "$$ Spyglass :sold 20 gp",
  ]);

  it("groups held items by holder in name order, the party's own last", () => {
    expect(summary.groups.map(({ holder, items }) => [holder, items.map((item) => item.name)])).toEqual([
      ["Brother Aldric", ["Holy symbol"]],
      ["Mira", ["Flame Tongue", "Silvered lantern"]],
      ["", ["Potion of healing"]],
    ]);
    expect(summary.heldCount).toBe(4);
  });

  it("keeps gone items apart, most recently named first", () => {
    expect(summary.gone.map((item) => [item.name, item.gone?.kind])).toEqual([
      ["Spyglass", "sold"],
      ["Rope", "used"],
    ]);
  });

  it("summarises a campaign with no items as empty", () => {
    expect(summaryOf(["$ 5 gp"])).toEqual({ groups: [], gone: [], heldCount: 0 });
  });
});
