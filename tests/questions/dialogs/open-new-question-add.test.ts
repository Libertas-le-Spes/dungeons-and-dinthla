import { describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { ANSWER_GOES_ELSEWHERE, SAME_TEXT_AS_EXISTING } from "../../../src/questions/writing/current-question";
import type { NewQuestion } from "../../../src/questions/writing/new-question";
import { openNewQuestion } from "../../../src/questions/dialogs/open-new-question";
import { DialogCampaign, lastDialog } from "../../campaign/dialog-campaign";

const ONE = "Pale Moon/Sessions/Session 1.md";

const app = {} as App;

function addThroughDialog(campaign: DialogCampaign, entry: NewQuestion): Promise<boolean> {
  openNewQuestion(app, campaign.gate, campaign.store, () => undefined);
  return lastDialog<{ add(entry: NewQuestion): Promise<boolean> }>().add(entry);
}

describe("the new question dialog", () => {
  it("writes the question into the session", async () => {
    const campaign = new DialogCampaign({ [ONE]: "We rode on.\n" });
    expect(await addThroughDialog(campaign, { question: "Who", answer: "" })).toBe(true);
    expect(campaign.texts.get(ONE)).toBe("We rode on.\n? Who\n");
  });

  it("refuses a question that already reads the same, writing nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Who\n" });
    await expect(addThroughDialog(campaign, { question: "? Who", answer: "" })).rejects.toThrow(SAME_TEXT_AS_EXISTING);
    expect(campaign.writes).toBe(0);
  });

  it("refuses an answer another question starting the same way would take, writing nothing", async () => {
    const campaign = new DialogCampaign({ [ONE]: "? Whom: sent\n" });
    await expect(addThroughDialog(campaign, { question: "Whom", answer: "sent: y" })).rejects.toThrow(ANSWER_GOES_ELSEWHERE);
    expect(campaign.writes).toBe(0);
  });
});
