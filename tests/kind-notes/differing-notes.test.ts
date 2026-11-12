import { describe, expect, it, vi } from "vitest";
import { DifferingNotes } from "../../src/kind-notes/differing-notes";
import type { WantedNote } from "../../src/kind-notes/wanted-note";

const NOTE: WantedNote = {
  path: "D&D/Pale Moon/Questions/Session 2.md",
  folder: "Questions",
  sessionPath: "D&D/Pale Moon/Sessions/Session 2.md",
  sessionFile: null,
  lines: ["? Who sent Mira"],
};

function differingWith(outOfStep: boolean) {
  const keeper = { isOutOfStep: vi.fn(() => outOfStep), keep: vi.fn() };
  const ask = vi.fn();
  return { differing: new DifferingNotes(keeper, ask), keeper, ask };
}

describe("DifferingNotes", () => {
  it("asks once, in one line, about a note that differs from its session", () => {
    const { differing, ask } = differingWith(true);
    differing.check([NOTE]);
    differing.check([NOTE]);
    expect(ask).toHaveBeenCalledOnce();
    expect(ask.mock.calls[0]?.[0]).toBe("Questions for Session 2 differ from the session.");
  });

  it("asks about nothing when the note matches its session", () => {
    const { differing, ask } = differingWith(false);
    differing.check([NOTE]);
    expect(ask).not.toHaveBeenCalled();
  });

  it("writes the note's lines from the session when the answer is Fix, and only then", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.check([NOTE]);
    expect(keeper.keep).not.toHaveBeenCalled();
    ask.mock.calls[0]?.[1]();
    expect(keeper.keep).toHaveBeenCalledExactlyOnceWith([NOTE]);
  });

  it("writes nothing when the answer is Keep, and doesn't ask again about the same lines", () => {
    const { differing, ask, keeper } = differingWith(true);
    differing.check([NOTE]);
    ask.mock.calls[0]?.[2]();
    differing.check([NOTE]);
    expect(keeper.keep).not.toHaveBeenCalled();
    expect(ask).toHaveBeenCalledOnce();
  });

  it("asks again when the session's lines change after a Keep", () => {
    const { differing, ask } = differingWith(true);
    differing.check([NOTE]);
    differing.check([{ ...NOTE, lines: ["? Who sent Baka"] }]);
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it("asks again about a note after a save forgot it", () => {
    const { differing, ask } = differingWith(true);
    differing.check([NOTE]);
    differing.forget([NOTE]);
    differing.check([NOTE]);
    expect(ask).toHaveBeenCalledTimes(2);
  });
});
