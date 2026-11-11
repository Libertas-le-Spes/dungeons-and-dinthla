import { describe, expect, it } from "vitest";
import { questTrackedKind } from "../../../src/kinds/quest-tracked-kind";
import { followUpLine, isFollowUpLine, openingAfterLine, openingTextOf } from "../../../src/notes/writing/thread-lines";

describe("thread lines", () => {
  it("knows a follow-up line by its name, its subject and what it says", () => {
    expect(isFollowUpLine("?= Who sent the letter : Mira", "answer", "Who sent the letter", "Mira")).toBe(true);
    expect(isFollowUpLine("?= Who sent the letter: Lady Vess", "answer", "Who sent the letter", "Mira")).toBe(false);
    expect(isFollowUpLine("?+ Who sent the letter: Mira", "answer", "Who sent the letter", "Mira")).toBe(false);
    expect(isFollowUpLine("?= Who sent it: Mira", "answer", "Who sent the letter", "Mira")).toBe(false);
  });

  it("writes a follow-up line naming its subject on one line", () => {
    expect(followUpLine("progress", "Find it", " tracks\n lead on ")).toBe("!+ Find it: tracks lead on");
  });

  it("reads typed opening text without the kind's marker, and keeps text that has none", () => {
    expect(openingTextOf(questTrackedKind.marker, "  !  Find\n it ")).toBe("Find it");
    expect(openingTextOf(questTrackedKind.marker, "Find it")).toBe("Find it");
  });

  it("writes the next opening line after an earlier one", () => {
    expect(openingAfterLine(questTrackedKind.marker, "! Escort [[Mira]]", "Find it")).toBe("! Escort [[Mira]], after: Find it");
  });
});
