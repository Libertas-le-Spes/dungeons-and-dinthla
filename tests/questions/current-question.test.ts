import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { QuestionRecord } from "../../src/campaign/campaign";
import { currentQuestion, sessionOfQuestion, sharesTextWithEarlierOpenQuestion } from "../../src/questions/current-question";
import { CHANGED_IN_NOTE } from "../../src/questions/question-writer";

function questionsOf(lines: string[], path = "Pale Moon/Sessions/Session 4.md"): QuestionRecord[] {
  return buildCampaign([{ path, number: 4, firstLine: 0, text: lines.join("\n") }]).questions;
}

describe("currentQuestion", () => {
  it("finds the question the dialog opened, as it is now", () => {
    const [opened] = questionsOf(["? Who"]);
    expect(currentQuestion(questionsOf(["? Who"]), opened!).text).toBe("Who");
  });

  it("refuses when another question has moved into its line", () => {
    const opened = questionsOf(["? Alpha", "? Beta", "?= Alpha: Mira"])[1]!;
    expect(() => currentQuestion(questionsOf(["We rode on.", "? Alpha", "? Beta"]), opened)).toThrow(CHANGED_IN_NOTE);
  });

  it("refuses when the question was answered elsewhere while the dialog was open", () => {
    const [opened] = questionsOf(["? Who"]);
    expect(() => currentQuestion(questionsOf(["? Who", "?= Who: Lady Vess"]), opened!)).toThrow(CHANGED_IN_NOTE);
  });

  it("refuses when its answer was edited by hand while the dialog was open", () => {
    const [opened] = questionsOf(["? Who", "?= Who: Mira"]);
    expect(() => currentQuestion(questionsOf(["? Who", "?= Who: Mira (maybe)"]), opened!)).toThrow(CHANGED_IN_NOTE);
  });
});

describe("sharesTextWithEarlierOpenQuestion", () => {
  it("sees an earlier open question with the same text", () => {
    const questions = questionsOf(["? Who", "? Who"]);
    expect(sharesTextWithEarlierOpenQuestion(questions, questions[1]!)).toBe(true);
    expect(sharesTextWithEarlierOpenQuestion(questions, questions[0]!)).toBe(false);
  });

  it("ignores an earlier one that is already answered", () => {
    const questions = questionsOf(["? Who", "?= Who: Mira", "? Who"]);
    expect(sharesTextWithEarlierOpenQuestion(questions, questions[1]!)).toBe(false);
  });
});

describe("sessionOfQuestion", () => {
  it("gives the number of the session the question was asked in", () => {
    expect(sessionOfQuestion(questionsOf(["? Who"])[0]!, "Pale Moon")).toBe(4);
  });
});
