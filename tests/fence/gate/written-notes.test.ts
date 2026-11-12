import { describe, expect, it, vi } from "vitest";
import { NoteReporter } from "../../../src/fence/gate/written-notes";

describe("NoteReporter", () => {
  it("tells each listener about a change, a made note and a trashed note", () => {
    const reporter = new NoteReporter();
    const first = vi.fn();
    const second = vi.fn();
    reporter.notes.listen(first);
    reporter.notes.listen(second);
    reporter.changed("D&D/Pale Moon/Sessions/Session 1.md", "text");
    reporter.made("D&D/Pale Moon/Funds/Session 1.md");
    reporter.trashed("D&D/Pale Moon/Funds/Session 1.md");
    expect(first.mock.calls).toEqual([
      [{ change: "changed", path: "D&D/Pale Moon/Sessions/Session 1.md", text: "text" }],
      [{ change: "made", path: "D&D/Pale Moon/Funds/Session 1.md", text: null }],
      [{ change: "trashed", path: "D&D/Pale Moon/Funds/Session 1.md", text: null }],
    ]);
    expect(second).toHaveBeenCalledTimes(3);
  });

  it("stops telling a listener that stopped listening", () => {
    const reporter = new NoteReporter();
    const heard = vi.fn();
    const stop = reporter.notes.listen(heard);
    stop();
    reporter.made("D&D/Pale Moon/Funds/Session 1.md");
    expect(heard).not.toHaveBeenCalled();
  });

  it("tells the other listeners, and doesn't throw, when one listener throws", () => {
    const reporter = new NoteReporter();
    const after = vi.fn();
    reporter.notes.listen(() => {
      throw new Error("a listener broke");
    });
    reporter.notes.listen(after);
    expect(() => reporter.made("D&D/Pale Moon/Funds/Session 1.md")).not.toThrow();
    expect(after).toHaveBeenCalledOnce();
  });
});
