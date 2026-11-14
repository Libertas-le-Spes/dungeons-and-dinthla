import { describe, expect, it, vi } from "vitest";
import { NewNameAnswers, type NewNameAnswersNeeds } from "../../../src/references/new-names/new-name-answers";
import type { PlannedReferenceNote } from "../../../src/references/making/reference-note-plan";

const CAMPAIGN = "Pale Moon";
const FIRST = { path: `${CAMPAIGN}/Sessions/Session 1.md`, number: 1, text: "", firstLine: 0 };
const MIRA = { name: "Mira", firstSession: FIRST, namedIn: [FIRST.path] };

function answersWith(changes: Partial<NewNameAnswersNeeds>) {
  const make = vi.fn(async (_note: PlannedReferenceNote) => "made" as const);
  const needs: NewNameAnswersNeeds = {
    maker: { make },
    askedIn: CAMPAIGN,
    campaignFolder: () => CAMPAIGN,
    existingNames: () => [],
    ...changes,
  };
  return { answers: new NewNameAnswers(needs), make };
}

describe("NewNameAnswers", () => {
  it.each([
    ["character", `${CAMPAIGN}/Characters/Mira.md`],
    ["place", `${CAMPAIGN}/Places/Mira.md`],
  ] as const)("makes the note in the folder of the chosen kind, %s", async (kind, path) => {
    const { answers, make } = answersWith({});
    expect(await answers.make({ undecided: MIRA, kind })).toBe("made");
    expect(make).toHaveBeenCalledExactlyOnceWith({ name: "Mira", kind, path, firstSession: FIRST });
  });

  it("makes nothing when the open campaign is no longer the one asked in", async () => {
    const { answers, make } = answersWith({ campaignFolder: () => "Other Moon" });
    expect(await answers.make({ undecided: MIRA, kind: "character" })).toBe("left");
    expect(make).not.toHaveBeenCalled();
  });

  it("makes nothing when no campaign is open any more", async () => {
    const { answers, make } = answersWith({ campaignFolder: () => null });
    expect(await answers.make({ undecided: MIRA, kind: "character" })).toBe("left");
    expect(make).not.toHaveBeenCalled();
  });

  it("makes nothing when a note of that name has appeared since, in any folder or case", async () => {
    const { answers, make } = answersWith({ existingNames: () => ["mira"] });
    expect(await answers.make({ undecided: MIRA, kind: "place" })).toBe("left");
    expect(make).not.toHaveBeenCalled();
  });

  it("ignores notes of other names", async () => {
    const { answers, make } = answersWith({ existingNames: () => ["Mirage"] });
    await answers.make({ undecided: MIRA, kind: "place" });
    expect(make).toHaveBeenCalledOnce();
  });
});
