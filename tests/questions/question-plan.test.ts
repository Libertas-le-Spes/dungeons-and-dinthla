import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { CHANGES_ANOTHER_QUESTION, planQuestionSave, planReopen, refusalForQuestionPlan } from "../../src/questions/question-plan";

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
    expect(refusalForQuestionPlan(sessions, question, planReopen(question, path(4)))).toBe(CHANGES_ANOTHER_QUESTION);
  });

  it("refuses an answer written into an earlier session that a same-text question would take", () => {
    expect(refusalFor({ 1: "? Who\n", 2: "? Who\n", 3: "", 5: "?= Who: Mira\n" }, 1, "Lady Vess", "", 3)).toBe(CHANGES_ANOTHER_QUESTION);
  });

  it("refuses a follow-up that a stray line would answer at once", () => {
    expect(refusalFor({ 1: "? Who\n", 2: "", 3: "?= Why her, after: Who: fear\n" }, 0, "", "Why her", 2)).toBe(CHANGES_ANOTHER_QUESTION);
  });

  it("writes a changed answer into the old answer's note", () => {
    const sessions = sessionsOf({ 1: "? Who\n?= Who: Mira\n", 2: "" });
    const question = buildCampaign(sessions).questions[0]!;
    expect(planQuestionSave(question, { answer: "Vess", followUp: "" }, path(2)).targetPath).toBe(path(1));
  });
});
