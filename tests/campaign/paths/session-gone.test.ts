import { describe, expect, it, vi } from "vitest";
import type { NoteRef } from "../../../src/host/notes/note-ref";
import { fileAt as noteAt } from "../../stubs/note-files";
import { OpenedSession, sessionGoneWords } from "../../../src/campaign/paths/session-gone";

const SEVEN = "Pale Moon/Sessions/Session 7.md";

function fileAt(path: string): NoteRef {
  return noteAt(path);
}

function filesHolding(held: NoteRef[]) {
  return {
    held,
    note: vi.fn((path: string) => {
      const found = held.find((file) => file.path === path);
      if (found === undefined) return null;
      return found;
    }),
  };
}

describe("sessionGoneWords", () => {
  it("names the session and says nothing was written", () => {
    expect(sessionGoneWords(SEVEN)).toBe("Session 7 was moved or deleted, so nothing was written.");
  });
});

describe("OpenedSession", () => {
  it("says nothing while the same file is at the path", () => {
    const files = filesHolding([fileAt(SEVEN)]);
    expect(() => new OpenedSession(files, SEVEN).refuseIfMoved()).not.toThrow();
  });

  it("refuses with the words when the note is gone", () => {
    const files = filesHolding([fileAt(SEVEN)]);
    const session = new OpenedSession(files, SEVEN);
    files.held.pop();
    expect(() => session.refuseIfMoved()).toThrow(new Error(sessionGoneWords(SEVEN)));
  });

  it("refuses when another file now sits at the path, as after a rename or a note made again", () => {
    const files = filesHolding([fileAt(SEVEN)]);
    const session = new OpenedSession(files, SEVEN);
    files.held.splice(0, 1, fileAt(SEVEN));
    expect(() => session.refuseIfMoved()).toThrow(new Error(sessionGoneWords(SEVEN)));
  });

  it("refuses when there was no note at the path when it was opened", () => {
    const files = filesHolding([]);
    const session = new OpenedSession(files, SEVEN);
    files.held.push(fileAt(SEVEN));
    expect(() => session.refuseIfMoved()).toThrow(new Error(sessionGoneWords(SEVEN)));
  });

  it("keeps the path it was opened on", () => {
    expect(new OpenedSession(filesHolding([]), SEVEN).path).toBe(SEVEN);
  });
});
