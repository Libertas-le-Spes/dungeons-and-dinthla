import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { SAME_TITLE_AS_EXISTING, type NewQuest } from "../../src/quests/new-quest";
import { openNewQuest } from "../../src/quests/open-new-quest";
import { DialogCampaign, lastDialog } from "../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";

const app = {} as App;

function addThroughDialog(campaign: DialogCampaign, entry: NewQuest): Promise<boolean> {
  openNewQuest(app, campaign.gate, campaign.store, () => undefined);
  return lastDialog<{ add(entry: NewQuest): Promise<boolean> }>().add(entry);
}

describe("the new quest dialog", () => {
  it("writes the quest into the session", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n" });
    expect(await addThroughDialog(campaign, { title: "Find it", givenBy: "", reward: "" })).toBe(true);
    expect(campaign.texts.get(ONE)).toBe("We rode on.\n! Find it\n");
  });

  it("refuses a title another quest has, writing nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "! Find it\n" });
    await expect(addThroughDialog(campaign, { title: "Find it", givenBy: "", reward: "" })).rejects.toThrow(SAME_TITLE_AS_EXISTING);
    expect(campaign.writes).toBe(0);
  });
});
