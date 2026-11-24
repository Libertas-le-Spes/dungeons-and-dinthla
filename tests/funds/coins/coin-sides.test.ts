import { describe, expect, it, vi } from "vitest";
import { MineSide, PARTY_SIDE } from "../../../src/funds/coins/coin-sides";
import { PARTY_COIN } from "../../../src/funds/coins/coin-readers";
import type { NoteRef } from "../../../src/host/notes/note-ref";

const SESSION = "Pale Moon/Sessions/Session 2.md";
const MIRA = { path: "Pale Moon/Characters/Mira.md", basename: "Mira" } as NoteRef;
const FIVE_GP = { direction: "in" as const, amount: "5 gp", what: "found" };

describe("the sides coin is added on", () => {
  it("reads Party's coin as the party's", () => {
    expect(PARTY_SIDE.readerIn()).toBe(PARTY_COIN);
  });

  it("links the character in play from the session the line goes into", () => {
    const linkTextTo = vi.fn(() => "Pale Moon/Characters/Mira");
    const reader = new MineSide(() => MIRA).readerIn(SESSION, { linkTextTo });
    expect(linkTextTo).toHaveBeenCalledExactlyOnceWith(MIRA, SESSION, true);
    expect(reader?.readingOf(FIVE_GP)).toMatchObject({ line: "$ [[Pale Moon/Characters/Mira]] 5 gp found" });
    expect(reader?.addsWords("Session 2")).toBe("Adds a line for Mira to Session 2.");
  });

  it("has no one to write for when no character of yours is in play", () => {
    const linkTextTo = vi.fn(() => "Mira");
    expect(new MineSide(() => null).readerIn(SESSION, { linkTextTo })).toBeNull();
    expect(linkTextTo).not.toHaveBeenCalled();
  });
});
