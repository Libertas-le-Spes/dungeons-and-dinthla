import { describe, expect, it, vi } from "vitest";
import { DifferingNotes } from "../../../src/kind-notes/watching/differing-notes";
import type { WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { firstOf } from "../../stubs/lists";
import { fileAt } from "../fake-notes";

const SESSION = "D&D/Pale Moon/Sessions/Session 2.md";

const NOTE: WantedNote = {
  path: "D&D/Pale Moon/Questions/Session 2.md",
  folder: "Questions",
  sessionPath: SESSION,
  sessionFile: fileAt(SESSION),
  lines: ["? Who sent Mira"],
};

function asked(ask: { mock: { calls: unknown[][] } }) {
  const [message, fix, keep] = firstOf(ask.mock.calls);
  return { message: String(message), fix: fix as () => void, keep: keep as () => void };
}

function notesOf(path: string, mine: WantedNote[], other: WantedNote): WantedNote[] {
  if (path === SESSION) return mine;
  return [other];
}

const SESSION_THREE_FUNDS: WantedNote = { ...NOTE, path: "D&D/Pale Moon/Funds/Session 3.md", folder: "Funds", sessionPath: "D&D/Pale Moon/Sessions/Session 3.md" };

function notesOfTwoSessions(path: string): WantedNote[] {
  return notesOf(path, [NOTE], SESSION_THREE_FUNDS);
}

function differingWith(outOfStep: boolean) {
  const keeper = { isOutOfStep: vi.fn(() => outOfStep), keep: vi.fn() };
  const current = { notes: [NOTE] };
  const wants = { notesFor: vi.fn(() => current.notes) };
  const dismiss = vi.fn();
  const ask = vi.fn();
  ask.mockReturnValue(dismiss);
  return { differing: new DifferingNotes(keeper, wants, ask), keeper, ask, dismiss, current };
}

describe("DifferingNotes", () => {
  it("asks once, in one line, about a note that differs from its session", () => {
    const { differing, ask } = differingWith(true);
    differing.check(SESSION);
    differing.check(SESSION);
    expect(ask).toHaveBeenCalledOnce();
    expect(asked(ask).message).toBe("Questions for Session 2 differ from the session.");
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
    asked(ask).fix();
    expect(keeper.keep).toHaveBeenCalledExactlyOnceWith([NOTE]);
  });

  it("writes the lines the session holds when Fix is pressed, not the ones it held when asked, if they still differ", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [{ ...NOTE, lines: ["? Who sent Baka"] }];
    asked(ask).fix();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when Fix is pressed after the session was deleted", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [{ ...NOTE, sessionFile: null }];
    asked(ask).fix();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when Fix is pressed and the note is no longer wanted at all", () => {
    const { differing, ask, keeper, current } = differingWith(true);
    differing.check(SESSION);
    current.notes = [];
    asked(ask).fix();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("writes nothing when the answer is Keep, and doesn't ask again about the same lines", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.check(SESSION);
    asked(ask).keep();
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
    const wants = { notesFor: vi.fn((path: string) => notesOf(path, mine, other)) };
    const ask = vi.fn();
    ask.mockReturnValue(vi.fn());
    new DifferingNotes(keeper, wants, ask).checkAll([SESSION, "D&D/Pale Moon/Sessions/Session 3.md"]);
    expect(ask).toHaveBeenCalledOnce();
    expect(asked(ask).message).toBe("3 notes differ from their sessions.");
    asked(ask).fix();
    expect(keeper.keep).toHaveBeenCalledTimes(3);
  });

  it("asks in the note's own words when only one note differs at the opening", () => {
    const { differing, ask } = differingWith(true);
    differing.checkAll([SESSION]);
    expect(asked(ask).message).toBe("Questions for Session 2 differ from the session.");
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
    asked(ask).keep();
    expect(keeper.keep).not.toHaveBeenCalled();
  });

  it("dismisses the question about a note once a save of its session puts the note right", () => {
    const { differing, dismiss } = differingWith(true);
    differing.check(SESSION);
    expect(dismiss).not.toHaveBeenCalled();
    differing.forget(SESSION);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("dismisses the question only once when the session is saved again", () => {
    const { differing, dismiss } = differingWith(true);
    differing.check(SESSION);
    differing.forget(SESSION);
    differing.forget(SESSION);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("keeps a question about notes of two sessions until saves of both put them right", () => {
    const keeper = { isOutOfStep: vi.fn(), keep: vi.fn() };
    keeper.isOutOfStep.mockReturnValue(true);
    const wants = { notesFor: vi.fn(notesOfTwoSessions) };
    const dismiss = vi.fn();
    const ask = vi.fn();
    ask.mockReturnValue(dismiss);
    const differing = new DifferingNotes(keeper, wants, ask);
    differing.checkAll([SESSION, "D&D/Pale Moon/Sessions/Session 3.md"]);
    differing.forget(SESSION);
    expect(dismiss).not.toHaveBeenCalled();
    differing.forget("D&D/Pale Moon/Sessions/Session 3.md");
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("dismisses nothing when a session is saved and nothing was asked about it", () => {
    const { differing, dismiss } = differingWith(true);
    differing.forget(SESSION);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
