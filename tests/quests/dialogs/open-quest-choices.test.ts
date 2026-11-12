import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import type { Source } from "../../../src/campaign/record/campaign";
import { CHANGED_IN_NOTE } from "../../../src/campaign/writing/note-editor";
import { GOES_ELSEWHERE } from "../../../src/quests/writing/current-quest";
import { openQuest } from "../../../src/quests/dialogs/open-quest";
import type { QuestEdit } from "../../../src/quests/writing/quest-plan";
import { DialogCampaign, lastDialog, SESSION_TWO_LOST } from "../../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

interface QuestChoices {
  save(edit: QuestEdit): Promise<boolean>;
  delete(): Promise<boolean>;
}

const app = {} as App;

function questChoices(campaign: DialogCampaign, source: Source, activePath: string = ONE): QuestChoices {
  openQuest(app, campaign.gate, campaign.store, source, () => undefined, () => undefined, activePath);
  return lastDialog<{ choices: QuestChoices }>().choices;
}

function edit(changes: Partial<QuestEdit>): QuestEdit {
  return { status: "active", happened: "", collectReward: false, followUp: "", ...changes };
}

describe("the quest dialog's choices", () => {
  it("checks a save before writing it", async () => {
    const campaign = new DialogCampaign({ [ONE]: "! Guard\n! Guard: east\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.save(edit({ happened: "east: y" }))).rejects.toThrow(GOES_ELSEWHERE);
    expect(campaign.writes).toBe(0);
  });

  it("takes the quest as the campaign reads it now, so one changed since the dialog opened is refused", async () => {
    const campaign = new DialogCampaign({ [ONE]: "! Find it\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n! Find it\n");
    campaign.readAgain();
    await expect(choices.save(edit({ happened: "tracks" }))).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.texts.get(ONE)).toBe("We waited.\n! Find it\n");
  });
});

describe("the quest dialog's delete", () => {
  it("takes the quest as the campaign reads it now, so one changed since the dialog opened is refused with a promise that rejects", async () => {
    const campaign = new DialogCampaign({ [ONE]: "! Find it\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n! Find it\n");
    campaign.readAgain();
    await expect(choices.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.writes).toBe(0);
  });
});

describe("the quest dialog's choices, when the session they write into is gone", () => {
  it.each(SESSION_TWO_LOST)("refuses a save with the session gone words, writing nothing when its session was %s", async (_how, lost) => {
    const campaign = new DialogCampaign({ [ONE]: "! Find it\n", [TWO]: "We camped.\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 }, TWO);
    lost(campaign);
    await expect(choices.save(edit({ happened: "tracks" }))).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect(campaign.writes).toBe(0);
    expect(campaign.texts.get(ONE)).toBe("! Find it\n");
  });
});
