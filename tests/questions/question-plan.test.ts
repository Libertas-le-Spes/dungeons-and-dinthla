import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { applyQuestionPlan, CHANGES_MORE_THAN_ASKED, FOLLOW_UP_ALREADY_ASKED, planQuestionSave, planReopen, refusalForQuestionPlan } from "../../src/questions/question-plan";

function sessionsOf(notes: Record<number, string>): SessionNote[] {
  return Object.entries(notes).map(([number, text]) => sessionNoteOf(`Pale Moon/Sessions/Session ${number}.md`, Number(number), text));
}

function path(number: number): string {
  return `Pale Moon/Sessions/Session ${number}.md`;
}

function refusalFor(notes: Record<number, string>, index: number, answer: string, followUp: string, sessionNumber: number): string | null {
  const sessions = sessionsOf(notes);
  const question = buildCampaign(sessions).questions[index]!;
  return refusalForQuestionPlan(sessions, question, planQuestionSave(question, { answer, followUp }, path(sessionNumber)));
}

describe("refusalForQuestionPlan", () => {
  it("lets an ordinary answer, change, clearing and follow-up through", () => {
    expect(refusalFor({ 1: "? Who\n" }, 0, "Mira", "", 1)).toBeNull();
    expect(refusalFor({ 1: "? Who\n?= Who: Mira\n", 2: "" }, 0, "Lady Vess", "", 2)).toBeNull();
    expect(refusalFor({ 1: "? Who\n?= Who: Mira\n" }, 0, "", "", 1)).toBeNull();
    expect(refusalFor({ 1: "? Who\n" }, 0, "", "Why her", 1)).toBeNull();
  });

  it("refuses reopening a question that would take a later same-text question's clue", () => {
    const sessions = sessionsOf({ 1: "? Who\n", 2: "?= Who: Mira\n", 3: "? Who\n", 4: "?+ Who: lantern oil\n" });
    const question = buildCampaign(sessions).questions[0]!;
    expect(refusalForQuestionPlan(sessions, question, planReopen(question, path(4)))).toBe(CHANGES_MORE_THAN_ASKED);
  });

  it("refuses an answer written into an earlier session that a same-text question would take", () => {
    expect(refusalFor({ 1: "? Who\n", 2: "? Who\n", 3: "", 5: "?= Who: Mira\n" }, 1, "Lady Vess", "", 3)).toBe(CHANGES_MORE_THAN_ASKED);
  });

  it("refuses a follow-up that a stray line would answer at once", () => {
    expect(refusalFor({ 1: "? Who\n", 2: "", 3: "?= Why her, after: Who: fear\n" }, 0, "", "Why her", 2)).toBe(CHANGES_MORE_THAN_ASKED);
  });

  it("writes a changed answer into the old answer's note, and a follow-up into the session you're in", () => {
    const sessions = sessionsOf({ 1: "? Who sent it\n", 2: "?= Who sent it: Mira\n", 3: "" });
    const question = buildCampaign(sessions).questions[0]!;
    const plan = planQuestionSave(question, { answer: "Lady Vess", followUp: "Why her" }, path(3));
    expect(refusalForQuestionPlan(sessions, question, plan)).toBeNull();
    const after = applyQuestionPlan(sessions, plan).map((session) => session.text);
    expect(after).toEqual(["? Who sent it\n", "?= Who sent it: Lady Vess\n", "? Why her, after: Who sent it\n"]);
  });

  it("refuses an answer that would swap answer lines with a question starting the same way", () => {
    expect(refusalFor({ 1: "? Who: sent\n? Who\n", 2: "", 3: "?= Who: sent: y\n" }, 1, "sent: y", "", 2)).toBe(CHANGES_MORE_THAN_ASKED);
  });

  it("refuses a follow-up that reads like a question already asked", () => {
    expect(refusalFor({ 1: "? Who\n? Why, after: Who\n" }, 0, "", "Why", 1)).toBe(FOLLOW_UP_ALREADY_ASKED);
  });
});
