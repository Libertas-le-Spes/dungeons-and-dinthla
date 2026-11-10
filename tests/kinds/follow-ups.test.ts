import { describe, expect, it } from "vitest";
import { FOLLOW_UP_NAMES, type FollowUpName } from "../../src/kinds/follow-up-name";
import { followUpNamedBy, kindFollowsUpWith } from "../../src/kinds/follow-ups";
import { questTrackedKind } from "../../src/kinds/quest-tracked-kind";
import { questionTrackedKind } from "../../src/kinds/question-tracked-kind";
import type { TrackedKind } from "../../src/kinds/tracked-kind";

function followUpsOf(kind: TrackedKind): FollowUpName[] {
  return FOLLOW_UP_NAMES.filter((name) => kindFollowsUpWith(kind, name));
}

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
    expect(followUpsOf(questionTrackedKind)).toEqual(["clue", "answer"]);
  });

  it("says a quest follows up with progress and each outcome only", () => {
    expect(followUpsOf(questTrackedKind)).toEqual(["progress", "completed", "failed"]);
  });
});
