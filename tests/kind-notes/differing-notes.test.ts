import { describe, expect, it, vi } from "vitest";
import { DifferingNotes } from "../../src/kind-notes/differing-notes";
import type { WantedNote } from "../../src/kind-notes/wanted-note";
import { fileAt } from "./fake-notes";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";

const NOTE: WantedNote = {
  path: "D&D/Pale Moon/Questions/Session 2.md",
  folder: "Questions",
  sessionPath: SESSION,
  sessionFile: fileAt(SESSION),
  lines: ["? Who sent Mira"],
};

function differingWith(outOfStep: boolean) {
  const keeper = { isOutOfStep: vi.fn(() => outOfStep), keep: vi.fn() };
  const current = { notes: [NOTE] };
  const wants = { notesFor: vi.fn(() => current.notes) };
  const ask = vi.fn();
  return { differing: new DifferingNotes(keeper, wants, ask), keeper, ask, current };
}

describe("DifferingNotes", () => {
  it("asks once, in one line, about a note that differs from its session", () => {
    const { differing, ask } = differingWith(true);
    differing.check(SESSION);
    differing.check(SESSION);
    expect(ask).toHaveBeenCalledOnce();
    expect(ask.mock.calls[0]?.[0]).toBe("Questions for Session 2 differ from the session.");
  });

  it("asks about nothing when the note matches its session", () => {
    const { differing, ask } = differingWith(false);
    differing.check(SESSION);
    expect(ask).not.toHaveBeenCalled();
  });

  it("writes the note's lines from the session when the answer is Fix, and only then", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.check(SESSION);
    expect(keeper.keep).not.toHaveBeenCalled();
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).toHaveBeenCalledExactlyOnceWith([NOTE]);
  });

  it("writes the lines the session holds when Fix is pressed, not the ones it held when asked, if they still differ", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [{ ...NOTE, lines: ["? Who sent Baka"] }];
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when Fix is pressed after the session was deleted", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [{ ...NOTE, sessionFile: null }];
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when Fix is pressed and the note is no longer wanted at all", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [];
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when the answer is Keep, and doesn't ask again about the same lines", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.check(SESSION);
    ask.mock.calls[0]?.[2]();
    differing.check(SESSION);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(ask).toHaveBeenCalledOnce();
  });

  it("asks again when the session's lines change after a Keep", () => {
    const { differing, ask, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [{ ...NOTE, lines: ["? Who sent Baka"] }];
    differing.check(SESSION);
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it("asks again about a note after a save forgot it", () => {
    const { differing, ask } = differingWith(true);
    differing.check(SESSION);
    differing.forget(SESSION);
    differing.check(SESSION);
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it("asks once, with a count, about many notes that differ when the campaign is opened, and fixes each of them on Fix", () => {
    const keeper = { isOutOfStep: vi.fn(() => true), keep: vi.fn() };
    const mine = [NOTE, { ...NOTE, path: "D&D/Pale Moon/Quests/Session 2.md", folder: "Quests" }];
    const other = { ...NOTE, path: "D&D/Pale Moon/Funds/Session 3.md", folder: "Funds", sessionPath: "D&D/Pale Moon/Sessions/Session 3.md" };
    const wants = { notesFor: vi.fn((path: string) => (path === SESSION ? mine : [other])) };
    const ask = vi.fn();
    new DifferingNotes(keeper, wants, ask).checkAll([SESSION, "D&D/Pale Moon/Sessions/Session 3.md"]);
    expect(ask).toHaveBeenCalledOnce();
    expect(ask.mock.calls[0]?.[0]).toBe("3 notes differ from their sessions.");
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).toHaveBeenCalledTimes(3);
  });

  it("asks in the note's own words when only one note differs at the opening", () => {
    const { differing, ask } = differingWith(true);
    differing.checkAll([SESSION]);
    expect(ask.mock.calls[0]?.[0]).toBe("Questions for Session 2 differ from the session.");
  });

  it("asks about nothing at the opening when no note differs", () => {
    const { differing, ask } = differingWith(false);
    differing.checkAll([SESSION]);
    expect(ask).not.toHaveBeenCalled();
  });

  it("doesn't ask again about the notes of a group already asked about, even one at a time", () => {
    const { differing, ask } = differingWith(true);
    differing.checkAll([SESSION]);
    differing.check(SESSION);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("leaves every note of a group as it is on Keep", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.checkAll([SESSION, SESSION]);
    ask.mock.calls[0]?.[2]();
    expect(keeper.keep).not.toHaveBeenCalled();
  });
});
