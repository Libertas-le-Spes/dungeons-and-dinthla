import { describe, expect, it, vi } from "vitest";
import { NoteReporter } from "../../../src/fence/gate/written-notes";
import { reportListenerSpy } from "./report-listener";

describe("NoteReporter", () => {
  it("tells each listener about a saved text, a trashed note and a rename", () => {
    const reporter = new NoteReporter();
    const first = reportListenerSpy();
    const second = reportListenerSpy();
    reporter.notes.listen(first);
    reporter.notes.listen(second);
    reporter.textSaved("D&D/Pale Moon/Sessions/Session 1.md", "text");
    reporter.trashed("D&D/Pale Moon/Funds/Session 1.md");
    reporter.renamed("D&D/Pale Moon/Sessions/Session 3.md", "D&D/Pale Moon/Sessions/Session 2.md");
    expect(first.textSaved).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Sessions/Session 1.md", "text");
    expect(first.trashed).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Funds/Session 1.md");
    expect(first.renamed).toHaveBeenCalledExactlyOnceWith("D&D/Pale Moon/Sessions/Session 3.md", "D&D/Pale Moon/Sessions/Session 2.md");
    expect(second.textSaved).toHaveBeenCalledOnce();
  });

  it("stops telling a listener that stopped listening", () => {
    const reporter = new NoteReporter();
    const heard = reportListenerSpy();
    const stop = reporter.notes.listen(heard);
    stop();
    reporter.trashed("D&D/Pale Moon/Funds/Session 1.md");
    expect(heard.heardNothing()).toBe(true);
  });

  it("tells the other listeners, and doesn't throw, when one listener throws", () => {
    const reporter = new NoteReporter();
    const after = reportListenerSpy();
    reporter.notes.listen({
      textSaved: vi.fn(),
      renamed: vi.fn(),
      trashed: () => {
        throw new Error("a listener broke");
      },
    });
    reporter.notes.listen(after);
    expect(() => reporter.trashed("D&D/Pale Moon/Funds/Session 1.md")).not.toThrow();
    expect(after.trashed).toHaveBeenCalledOnce();
  });
});
