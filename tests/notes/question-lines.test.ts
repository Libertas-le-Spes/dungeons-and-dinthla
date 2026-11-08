import { describe, expect, it } from "vitest";
import { answerLine, followUpQuestionLine, isFollowUpLine, isQuestionLine, questionLine, questionTextOf } from "../../src/notes/question-lines";

describe("question lines", () => {
  it("writes an answer as a ?= line naming the question", () => {
    expect(answerLine("Who sent the letter", "  [[Lady Vess]]\n sent it ")).toBe("?= Who sent the letter: [[Lady Vess]] sent it");
  });

  it("writes a follow-up as a new question after the earlier one", () => {
    expect(followUpQuestionLine("? Why would she hide it", "Who sent the letter")).toBe(
      "? Why would she hide it, after: Who sent the letter",
    );
  });

  it("knows a question's own line, after a bullet too", () => {
    expect(isQuestionLine("- ? Who sent the letter", "Who sent the letter")).toBe(true);
    expect(isQuestionLine("? Who sent the letters", "Who sent the letter")).toBe(false);
    expect(isQuestionLine("?= Who sent the letter: Mira", "Who sent the letter")).toBe(false);
  });

  it("knows a follow-up line by its kind, its question and what it says", () => {
    expect(isFollowUpLine("?= Who sent the letter : Mira", "answer", "Who sent the letter", "Mira")).toBe(true);
    expect(isFollowUpLine("?= Who sent the letter: Lady Vess", "answer", "Who sent the letter", "Mira")).toBe(false);
    expect(isFollowUpLine("?+ Who sent the letter: Mira", "answer", "Who sent the letter", "Mira")).toBe(false);
    expect(isFollowUpLine("?= Who sent it: Mira", "answer", "Who sent the letter", "Mira")).toBe(false);
  });

  it("reads a typed question without its marker or extra spaces, and writes it as a ? line", () => {
    expect(questionTextOf("  ?  Who sent\n the letter ")).toBe("Who sent the letter");
    expect(questionLine("Who sent the letter")).toBe("? Who sent the letter");
  });
});
