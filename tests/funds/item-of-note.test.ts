import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { itemOfNote } from "../../src/funds/item-of-note";

const ITEMS = buildCampaign([
  { path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "$ [[Mira]] [[Silvered lantern]]\n$ Potion of healing" },
]).items;

describe("itemOfNote", () => {
  it("is the item named like the note, whatever its capitals", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Silvered lantern.md")?.name).toBe("Silvered lantern");
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Potions/potion of Healing.md")?.name).toBe("Potion of healing");
  });

  it("is nothing when no item is named like the note", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Flame Tongue.md")).toBeNull();
  });
});
