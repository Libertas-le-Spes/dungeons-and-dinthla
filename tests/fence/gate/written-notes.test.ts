import { describe, expect, it, vi } from "vitest";
import { WrittenNotes } from "../../../src/fence/gate/written-notes";

describe("WrittenNotes", () => {
  it("tells each listener about a change, a made note and a trashed note", () => {
    const written = new WrittenNotes();
    const first = vi.fn();
    const second = vi.fn();
    written.listen(first);
    written.listen(second);
    written.changed("D&D/Pale Moon/Sessions/Session 1.md", "text");
    written.made("D&D/Pale Moon/Funds/Session 1.md");
    written.trashed("D&D/Pale Moon/Funds/Session 1.md");
    expect(first.mock.calls).toEqual([
      [{ change: "changed", path: "D&D/Pale Moon/Sessions/Session 1.md", text: "text" }],
      [{ change: "made", path: "D&D/Pale Moon/Funds/Session 1.md", text: null }],
      [{ change: "trashed", path: "D&D/Pale Moon/Funds/Session 1.md", text: null }],
    ]);
    expect(second).toHaveBeenCalledTimes(3);
  });

  it("stops telling a listener that stopped listening", () => {
    const written = new WrittenNotes();
    const heard = vi.fn();
    const stop = written.listen(heard);
    stop();
    written.made("D&D/Pale Moon/Funds/Session 1.md");
    expect(heard).not.toHaveBeenCalled();
  });
});
