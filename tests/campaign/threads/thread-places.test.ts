import { describe, expect, it } from "vitest";
import type { QuestionRecord } from "../../../src/campaign/record/campaign";
import { questionThreadKind } from "../../../src/campaign/threads/question-thread-kind";
import { latestSessionOf, placesOf } from "../../../src/campaign/threads/thread-places";

function placeIn(session: number, line: number) {
  return { path: `Pale Moon/Sessions/Session ${session}.md`, line };
}

describe("placesOf", () => {
  it("holds the opening line, each clue and the answer", () => {
    const question: QuestionRecord = {
      text: "Who",
      source: placeIn(1, 0),
      clues: [{ text: "oil", source: placeIn(2, 3) }],
      answer: { text: "Mira", source: placeIn(3, 4) },
    };
    expect(placesOf(questionThreadKind, question)).toEqual([placeIn(1, 0), placeIn(2, 3), placeIn(3, 4)]);
  });
});

describe("latestSessionOf", () => {
  it("gives the session of an answer written after everything else", () => {
    const question: QuestionRecord = { text: "Who", source: placeIn(1, 0), clues: [], answer: { text: "Mira", source: placeIn(5, 0) } };
    expect(latestSessionOf(questionThreadKind, question, "Pale Moon")).toBe(5);
  });

  it("keeps the latest session when an earlier one comes after it", () => {
    const question: QuestionRecord = { text: "Who", source: placeIn(3, 0), clues: [{ text: "oil", source: placeIn(1, 2) }], answer: null };
    expect(latestSessionOf(questionThreadKind, question, "Pale Moon")).toBe(3);
  });
});
