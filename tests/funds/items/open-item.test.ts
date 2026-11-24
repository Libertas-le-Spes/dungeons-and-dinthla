import { describe, expect, it } from "vitest";
import { openItemDialog } from "../../../src/funds/items/open-item";
import type { ItemEdit } from "../../../src/funds/items/item-plan";
import { DialogCampaign, lastDialog, SESSION_TWO_LOST } from "../../campaign/dialog-campaign";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { OBSIDIAN_SHOWING } from "../../host/showing/obsidian-showing";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";


interface ItemChoices {
  edit: ItemEdit;
  save(edit: ItemEdit): Promise<boolean>;
}

describe("the item dialog, when the session it writes into is gone", () => {
  it.each(SESSION_TWO_LOST)("refuses with the session gone words, writing nothing when its session was %s", async (_how, lost) => {
    const campaign = new DialogCampaign({ [ONE]: "$ Rope\n", [TWO]: "We camped.\n" });
    openItemDialog({ showing: OBSIDIAN_SHOWING, notes: campaign.gate.notes, openNoteAt: () => undefined }, campaign.store, "Rope", () => undefined, () => undefined, null, null, STUB_SYNTAX);
    lost(campaign);
    const dialog = lastDialog<ItemChoices>();
    await expect(dialog.save({ ...dialog.edit, status: "lost" })).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect(campaign.writes).toBe(0);
    expect(campaign.texts.get(ONE)).toBe("$ Rope\n");
  });
});
