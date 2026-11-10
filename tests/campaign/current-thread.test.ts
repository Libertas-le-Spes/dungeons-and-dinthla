import { describe, expect, it } from "vitest";
import type { QuestionRecord } from "../../src/campaign/campaign";
import { followUpWouldGoElsewhere, latestSessionOf, placesOf } from "../../src/campaign/current-thread";

function placeIn(session: number, line: number) {
  return { path: `Pale Moon/Sessions/Session ${session}.md`, line };
}

describe("placesOf", () => {
  it("holds the opening line, each note and the closing line", () => {
    const question: QuestionRecord = {
      text: "Who",
      source: placeIn(1, 0),
      notes: [{ text: "oil", source: placeIn(2, 3) }],
      closing: { text: "Mira", source: placeIn(3, 4) },
    };
    expect(placesOf(question)).toEqual([placeIn(1, 0), placeIn(2, 3), placeIn(3, 4)]);
  });
});

describe("latestSessionOf", () => {
  it("gives the session of a closing line written after everything else", () => {
    const question: QuestionRecord = { text: "Who", source: placeIn(1, 0), notes: [], closing: { text: "Mira", source: placeIn(5, 0) } };
    expect(latestSessionOf(question, "Pale Moon")).toBe(5);
  });

  it("keeps the latest session when an earlier one comes after it", () => {
    const question: QuestionRecord = { text: "Who", source: placeIn(3, 0), notes: [{ text: "oil", source: placeIn(1, 2) }], closing: null };
    expect(latestSessionOf(question, "Pale Moon")).toBe(3);
  });
});

describe("followUpWouldGoElsewhere", () => {
  it("ignores a closed thread whose text the follow-up would start with", () => {
    const ferry: QuestionRecord = { text: "Ferry", source: placeIn(1, 0), notes: [], closing: null };
    const crossing: QuestionRecord = { text: "Ferry: the crossing", source: placeIn(1, 1), notes: [], closing: { text: "done", source: placeIn(1, 2) } };
    expect(followUpWouldGoElsewhere([ferry, crossing], ferry, "the crossing: done")).toBe(false);
  });
});
