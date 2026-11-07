import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { keywordsOf, listQuestions } from "../../src/questions/question-list";

const campaign = buildCampaign([
  {
    path: "Pale Moon/Sessions/Session 1.md",
    number: 1,
    firstLine: 0,
    text: [
      "? Who sent the letter",
      "? Why does the Old Mill wheel turn at night",
      "? Who is the pale woman",
      "?= Who sent the letter: [[Lady Vess]] sent it",
    ].join("\n"),
  },
]);

function textsOf(questions: { text: string }[]): string[] {
  return questions.map((question) => question.text);
}

describe("keywordsOf", () => {
  it("splits a filter into lower-case words", () => {
    expect(keywordsOf("  Old   MILL ")).toEqual(["old", "mill"]);
  });

  it("reads an empty filter as no words", () => {
    expect(keywordsOf("   ")).toEqual([]);
  });
});

describe("listQuestions", () => {
  it("lists open questions newest first, with answered ones apart", () => {
    const list = listQuestions(campaign, []);
    expect(textsOf(list.open)).toEqual(["Who is the pale woman", "Why does the Old Mill wheel turn at night"]);
    expect(textsOf(list.answered)).toEqual(["Who sent the letter"]);
    expect([list.openCount, list.answeredCount]).toEqual([2, 1]);
  });

  it("keeps only questions holding every keyword, but counts them all", () => {
    const list = listQuestions(campaign, ["mill", "night"]);
    expect(textsOf(list.open)).toEqual(["Why does the Old Mill wheel turn at night"]);
    expect(list.answered).toEqual([]);
    expect([list.openCount, list.answeredCount]).toEqual([2, 1]);
  });

  it("finds an answered question by its answer", () => {
    expect(textsOf(listQuestions(campaign, ["vess"]).answered)).toEqual(["Who sent the letter"]);
  });

  it("matches part of a word", () => {
    expect(textsOf(listQuestions(campaign, ["pal"]).open)).toEqual(["Who is the pale woman"]);
  });
});
