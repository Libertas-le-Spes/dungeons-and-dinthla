import { describe, expect, it } from "vitest";
import { questThreadKind } from "../../src/campaign/quest-thread-kind";
import { questionThreadKind } from "../../src/campaign/question-thread-kind";

describe("the thread kinds", () => {
  it("add and end with exactly the follow-ups their tracked kind holds", () => {
    for (const kind of [questionThreadKind, questThreadKind]) {
      expect([kind.addingName, ...kind.endingNames].sort()).toEqual(Object.keys(kind.tracked.followUps).sort());
    }
  });
});
