import { describe, expect, it } from "vitest";
import { NoteMemos } from "../../../src/kind-notes/keeping/note-memos";
import { wantedKeyOf, type WantedNote } from "../../../src/kind-notes/wanting/wanted-note";

function noteWith(lines: string[]): WantedNote {
  return { path: "D&D/Pale Moon/Questions/Session 2.md", folder: "Questions", sessionPath: "D&D/Pale Moon/Sessions/Session 2.md", sessionFile: null, lines };
}

describe("NoteMemos", () => {
  it("holds the note last wanted at a path", () => {
    const memos = new NoteMemos();
    memos.want(noteWith(["? One"]));
    memos.want(noteWith(["? Two"]));
    expect(memos.wantedAt(noteWith([]).path)?.lines).toEqual(["? Two"]);
    expect(memos.wantedAt("elsewhere.md")).toBeUndefined();
  });

  it("knows lines are done once they settled or failed, and not other lines", () => {
    const memos = new NoteMemos();
    const note = noteWith(["? One"]);
    memos.want(note);
    expect(memos.isDone(note.path, wantedKeyOf(note))).toBe(false);
    memos.settle(note.path, wantedKeyOf(note));
    expect(memos.isDone(note.path, wantedKeyOf(note))).toBe(true);
    expect(memos.isSettled(note)).toBe(true);
    expect(memos.isDone(note.path, wantedKeyOf(noteWith(["? Two"])))).toBe(false);
    memos.fail(note.path, wantedKeyOf(noteWith(["? Two"])));
    expect(memos.isDone(note.path, wantedKeyOf(noteWith(["? Two"])))).toBe(true);
  });

  it("forgets that lines settled when the note is wanted again", () => {
    const memos = new NoteMemos();
    const note = noteWith(["? One"]);
    memos.settle(note.path, wantedKeyOf(note));
    memos.want(note);
    expect(memos.isSettled(note)).toBe(false);
  });

  it("keeps a failure only while the same lines are wanted", () => {
    const memos = new NoteMemos();
    const failed = noteWith(["? One"]);
    memos.fail(failed.path, wantedKeyOf(failed));
    memos.want(failed);
    expect(memos.isDone(failed.path, wantedKeyOf(failed))).toBe(true);
    memos.want(noteWith(["? Two"]));
    expect(memos.isDone(failed.path, wantedKeyOf(failed))).toBe(false);
  });

  it("stops waiting for a read once, for a note it was waiting for", () => {
    const memos = new NoteMemos();
    memos.waitForRead("a.md");
    expect(memos.stopWaiting("a.md")).toBe(true);
    expect(memos.stopWaiting("a.md")).toBe(false);
    expect(memos.stopWaiting("b.md")).toBe(false);
  });
});
