import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { openItemDialog } from "../../../src/funds/items/open-item";
import type { ItemEdit } from "../../../src/funds/items/item-plan";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

const app = {} as App;

interface ItemChoices {
  edit: ItemEdit;
  save(edit: ItemEdit): Promise<boolean>;
}

describe("the item dialog, when the session it writes into is gone", () => {
  it("refuses with the session gone words, writing nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "$ Rope\n", [TWO]: "We camped.\n" });
    openItemDialog(app, campaign.gate, campaign.store, "Rope", () => undefined, () => undefined, null);
    campaign.texts.delete(TWO);
    const dialog = lastDialog<ItemChoices>();
    await expect(dialog.save({ ...dialog.edit, status: "lost" })).rejects.toThrow("Session 2's note is gone, so nothing was written.");
    expect(campaign.writes).toBe(0);
    expect(campaign.texts.get(ONE)).toBe("$ Rope\n");
  });
});
