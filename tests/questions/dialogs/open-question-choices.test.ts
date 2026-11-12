import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import type { Source } from "../../../src/campaign/record/campaign";
import { CHANGED_IN_NOTE } from "../../../src/campaign/writing/note-editor";
import { ANSWER_GOES_ELSEWHERE } from "../../../src/questions/writing/current-question";
import { openQuestion } from "../../../src/questions/dialogs/open-question";
import { CHANGES_MORE_THAN_ASKED, type QuestionEdit } from "../../../src/questions/writing/question-plan";
import { DialogCampaign, lastDialog, SESSION_TWO_LOST } from "../../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

interface QuestionChoices {
  save(edit: QuestionEdit): Promise<boolean>;
  reopen(): Promise<boolean>;
  delete(): Promise<boolean>;
}

const app = {} as App;

function questionChoices(campaign: DialogCampaign, source: Source, activePath: string = ONE): QuestionChoices {
  openQuestion(app, campaign.gate, campaign.store, source, () => undefined, () => undefined, activePath);
  return lastDialog<{ choices: QuestionChoices }>().choices;
}

describe("the question dialog's choices", () => {
  it("checks an answer before writing it", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Whom\n? Whom: sent\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.save({ answer: "sent: y", followUp: "" })).rejects.toThrow(ANSWER_GOES_ELSEWHERE);
    expect(campaign.writes).toBe(0);
  });

  it("checks a reopen before writing it", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Where\n", [TWO]: "?= Where: mill\n?= Where: mill\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.reopen()).rejects.toThrow(CHANGES_MORE_THAN_ASKED);
    expect(campaign.writes).toBe(0);
  });

  it("takes the question as the campaign reads it now, so one changed since the dialog opened is refused on save", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n? Who\n");
    campaign.readAgain();
    await expect(choices.save({ answer: "Mira", followUp: "" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.texts.get(ONE)).toBe("We waited.\n? Who\n");
  });

  it("takes the question as the campaign reads it now, so one changed since the dialog opened is refused on reopen", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n?= Who: Mira\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "? Who\n?= Who: Lady Vess\n");
    campaign.readAgain();
    await expect(async () => choices.reopen()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.writes).toBe(0);
  });
});

describe("the question dialog's delete", () => {
  it("takes the question as the campaign reads it now, so one changed since the dialog opened is refused with a promise that rejects", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n? Who\n");
    campaign.readAgain();
    await expect(choices.delete()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.writes).toBe(0);
  });
});

describe("the question dialog's choices, when the session they write into is gone", () => {
  it.each(SESSION_TWO_LOST)("refuses a save with the session gone words, writing nothing when its session was %s", async (_how, lost) => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n", [TWO]: "We camped.\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 }, TWO);
    lost(campaign);
    await expect(choices.save({ answer: "Mira", followUp: "" })).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect(campaign.writes).toBe(0);
    expect(campaign.texts.get(ONE)).toBe("? Who\n");
  });

  it.each(SESSION_TWO_LOST)("refuses a reopen with the session gone words, writing nothing when its session was %s", async (_how, lost) => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n?= Who: Mira\n", [TWO]: "We camped.\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 }, TWO);
    lost(campaign);
    await expect(choices.reopen()).rejects.toThrow("Session 2 was moved or deleted, so nothing was written.");
    expect(campaign.writes).toBe(0);
  });
});
