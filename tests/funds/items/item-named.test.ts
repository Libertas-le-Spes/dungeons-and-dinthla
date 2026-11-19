import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { itemNamedAt } from "../../../src/funds/items/item-named";

const PATH = "Pale Moon/Sessions/Session 1.md";

function itemsOf(lines: string[]) {
  const session: SessionNote = { path: PATH, number: 1, text: lines.join("\n"), firstLine: 0 };
  return buildCampaign([session]).items;
}

describe("the holding a row opens", () => {
  const items = itemsOf(["$ [[Primary Monk]] Arrow x15", "$ [[Mira]] Arrow x5", "$$ Arrow x5 [[Mira]] :lost"]);

  it("is the one whose first line the row shows", () => {
    expect(itemNamedAt(items, "Arrow", { path: PATH, line: 0 })?.holder).toBe("Primary Monk");
  });

  it("is a gone holding found by the line that took it", () => {
    expect(itemNamedAt(items, "Arrow", { path: PATH, line: 2 })?.holder).toBe("Mira");
  });

  it("is the first of the name when no line is given or the line is another's", () => {
    expect(itemNamedAt(items, "Arrow", null)?.holder).toBe("Primary Monk");
    expect(itemNamedAt(items, "Arrow", { path: PATH, line: 9 })?.holder).toBe("Primary Monk");
  });
});
