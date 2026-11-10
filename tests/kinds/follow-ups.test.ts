import { describe, expect, it } from "vitest";
import { followUpNamedBy, kindFollowsUpWith } from "../../src/kinds/follow-ups";
import { questTrackedKind } from "../../src/kinds/quest-tracked-kind";
import { questionTrackedKind } from "../../src/kinds/question-tracked-kind";

describe("followUpNamedBy", () => {
  it("names each follow-up of a question and a quest by its symbol", () => {
    expect(["?+", "?=", "!+", "!=", "!x"].map(followUpNamedBy)).toEqual(["clue", "answer", "progress", "completed", "failed"]);
  });

  it("finds nothing for a symbol no kind follows up with", () => {
    expect(followUpNamedBy("$+")).toBeUndefined();
  });
});

describe("kindFollowsUpWith", () => {
  it("says a question follows up with a clue and an answer only", () => {
    expect(kindFollowsUpWith(questionTrackedKind, "clue")).toBe(true);
    expect(kindFollowsUpWith(questionTrackedKind, "answer")).toBe(true);
    expect(kindFollowsUpWith(questionTrackedKind, "progress")).toBe(false);
  });

  it("says a quest follows up with progress and each outcome only", () => {
    expect(kindFollowsUpWith(questTrackedKind, "progress")).toBe(true);
    expect(kindFollowsUpWith(questTrackedKind, "completed")).toBe(true);
    expect(kindFollowsUpWith(questTrackedKind, "failed")).toBe(true);
    expect(kindFollowsUpWith(questTrackedKind, "answer")).toBe(false);
  });
});
