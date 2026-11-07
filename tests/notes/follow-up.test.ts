import { describe, expect, it } from "vitest";
import { readFollowUp } from "../../src/notes/follow-up";

describe("readFollowUp", () => {
  it("reads each kind of follow-up", () => {
    expect(readFollowUp("?+ Who sent the letter: it smelled of lantern oil")).toEqual({
      kind: "clue",
      text: "Who sent the letter: it smelled of lantern oil",
    });
    expect(readFollowUp("?= Who sent the letter: [[Lady Vess]] sent it")?.kind).toBe("answer");
    expect(readFollowUp("!+ Find the caravan: tracks")?.kind).toBe("progress");
    expect(readFollowUp("!= Find the caravan: found it")?.kind).toBe("completed");
    expect(readFollowUp("!x Find the caravan: the wagons burned")?.kind).toBe("failed");
  });

  it("reads a follow-up after a list bullet", () => {
    expect(readFollowUp("- ?= Who: Mira")).toEqual({ kind: "answer", text: "Who: Mira" });
  });

  it("reads a follow-up with no space after its marker", () => {
    expect(readFollowUp("?=Who: Mira")).toEqual({ kind: "answer", text: "Who: Mira" });
  });

  it("leaves a quest whose title starts with an x alone", () => {
    expect(readFollowUp("!xylophone for the bard")).toBeNull();
  });

  it("leaves questions, quests, lookups and plain lines alone", () => {
    for (const line of ["? Who", "! Find it", "?? letter", "!! caravan", "We rode on."]) {
      expect(readFollowUp(line)).toBeNull();
    }
  });
});
