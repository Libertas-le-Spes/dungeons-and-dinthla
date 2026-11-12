import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { itemOfNote } from "../../../src/funds/item-notes/item-of-note";

const ITEMS = buildCampaign([
  { path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "$ [[Mira]] [[Silvered lantern]]\n$ Potion of healing\n$ Ring: +1\n$ Ring? +1\n$ Ring+1" },
]).items;

describe("itemOfNote", () => {
  it("is the item named like the note, whatever its capitals", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Silvered lantern.md")?.name).toBe("Silvered lantern");
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Potions/potion of Healing.md")?.name).toBe("Potion of healing");
  });

  it("is nothing when no item is named like the note", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Flame Tongue.md")).toBeNull();
  });

  it("is the item whose name the note's name stands for, once the characters Obsidian forbids are swapped for a dash", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Ring- +1.md")?.name).toBe("Ring: +1");
  });

  it("is the first item named when two items' names swap to the same note name", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Ring- +1.md")?.name).not.toBe("Ring? +1");
  });

  it("is the item with a plus sign in its name for a note named like it", () => {
    expect(itemOfNote(ITEMS, "Pale Moon/Items/Ring+1.md")?.name).toBe("Ring+1");
  });
});
