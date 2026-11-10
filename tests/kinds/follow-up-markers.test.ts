import { describe, expect, it } from "vitest";
import { followUpKindOf, kindFollowedUpBy } from "../../src/kinds/follow-up-markers";
import { questSourceKind } from "../../src/kinds/quest-source-kind";
import { questionSourceKind } from "../../src/kinds/question-source-kind";

describe("followUpKindOf", () => {
  it("reads each follow-up marker of a question and a quest", () => {
    expect(["?+", "?=", "!+", "!=", "!x"].map(followUpKindOf)).toEqual(["clue", "answer", "progress", "completed", "failed"]);
  });

  it("finds nothing for a marker no kind follows up with", () => {
    expect(followUpKindOf("$+")).toBeUndefined();
  });
});

describe("kindFollowedUpBy", () => {
  it("gives a clue and an answer to questions", () => {
    expect(kindFollowedUpBy("clue")).toBe(questionSourceKind);
    expect(kindFollowedUpBy("answer")).toBe(questionSourceKind);
  });

  it("gives progress and each outcome to quests", () => {
    expect(kindFollowedUpBy("progress")).toBe(questSourceKind);
    expect(kindFollowedUpBy("completed")).toBe(questSourceKind);
    expect(kindFollowedUpBy("failed")).toBe(questSourceKind);
  });
});
