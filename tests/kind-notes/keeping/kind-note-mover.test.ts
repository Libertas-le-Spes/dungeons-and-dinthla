import { describe, expect, it, vi } from "vitest";
import { KindNoteMover } from "../../../src/kind-notes/keeping/kind-note-mover";
import { firstOf } from "../../stubs/lists";
import { FakeNotes } from "../fake-notes";
import { CAMPAIGN, settled } from "../keeper-setup";

const THREE = `${CAMPAIGN}/Sessions/Session 3.md`;
const TWO = `${CAMPAIGN}/Sessions/Session 2.md`;
const Q3 = `${CAMPAIGN}/Questions/Session 3.md`;
const Q2 = `${CAMPAIGN}/Questions/Session 2.md`;
const F3 = `${CAMPAIGN}/Funds/Session 3.md`;
const F2 = `${CAMPAIGN}/Funds/Session 2.md`;

function moverWith(notes: FakeNotes, idle: (path: string) => Promise<void> = async () => {}) {
  const wants = { isSession: (path: string) => path.startsWith(`${CAMPAIGN}/Sessions/`), campaignFolder: CAMPAIGN as string | null };
  const keeper = { idle: vi.fn(idle) };
  return { mover: new KindNoteMover({ ...notes.needs(), keeper, wants }), keeper, wants };
}

function renumbered(notes: FakeNotes): void {
  notes.addSession(TWO);
}

describe("KindNoteMover", () => {
  it("moves a kind note to its session's new number and links the session by its new name", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? Who sent Mira"] }, "His words");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.noteAt(Q3)).toBeNull();
    expect(notes.noteAt(Q2)?.properties).toEqual({ session: `[[${CAMPAIGN}/Sessions/Session 2]]`, lines: ["? Who sent Mira"] });
    expect(notes.noteAt(Q2)?.words).toBe("His words");
  });

  it("moves each kind's note, and passes over a kind with no note", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? A"] }, "");
    notes.addNote(F3, { session: "[[Session 3]]", lines: ["$ 5 gp"] }, "");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.noteAt(Q2)).not.toBeNull();
    expect(notes.noteAt(F2)).not.toBeNull();
    expect(notes.files.rename).toHaveBeenCalledTimes(2);
    expect(notes.said).toEqual([]);
  });

  it("waits for the notes of the session that was deleted to be taken care of before it moves one into their place", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? A"] }, "");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { mover } = moverWith(notes, async (path) => {
      if (path === Q2) await held;
    });
    mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    release();
    await settled();
    expect(notes.files.rename).toHaveBeenCalledOnce();
  });

  it("leaves a note where it is, and says so once, when the note it would move onto is still there", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? A"] }, "");
    notes.addNote(Q2, { session: "[[Session 2]]", lines: [] }, "His words about the deleted session");
    const { mover } = moverWith(notes);
    mover.sessionRenamed(THREE, TWO);
    mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    expect(notes.noteAt(Q2)?.words).toBe("His words about the deleted session");
    expect(notes.said).toHaveLength(1);
    expect(firstOf(notes.said)).toContain(`${Q3} stays where it is`);
  });

  it("moves a note whose link already names the new session, as Obsidian may have rewritten it on the rename", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 2]]", lines: ["? Who sent Mira"] }, "His words");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.noteAt(Q3)).toBeNull();
    expect(notes.noteAt(Q2)?.properties?.session).toBe(`[[${CAMPAIGN}/Sessions/Session 2]]`);
  });

  it("leaves a note that isn't linked to the session it follows, and says so once", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, null, "My own questions");
    const { mover } = moverWith(notes);
    mover.sessionRenamed(THREE, TWO);
    mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    expect(notes.said).toHaveLength(1);
  });

  it("leaves a note that links another session", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 5]]", lines: [] }, "");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
  });

  it("leaves a note Obsidian hasn't read yet, and says so", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    notes.unread.add(Q3);
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    expect(notes.said).toHaveLength(1);
  });

  it("says once that a note couldn't be moved when the rename fails, and doesn't touch its properties", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    notes.failRename = new Error("disk full");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.actions.processFrontMatter).not.toHaveBeenCalled();
    expect(notes.said).toEqual(["Couldn't move Questions for Session 3 with its session: disk full"]);
  });

  it("ignores the rename of a file that isn't a session, such as a kind note it moved itself", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    notes.addNote(Q2, { session: "[[Session 2]]", lines: [] }, "");
    const { mover } = moverWith(notes);
    mover.sessionRenamed(Q3, Q2);
    mover.sessionRenamed(THREE, Q2);
    mover.sessionRenamed(Q3, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    expect(notes.said).toEqual([]);
  });

  it("does nothing while no campaign is open", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    const { mover, wants } = moverWith(notes);
    wants.campaignFolder = null;
    mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
  });

  it("moves the notes of several sessions one after the other in the order they were renamed", async () => {
    const notes = new FakeNotes();
    notes.addSession(TWO);
    notes.addSession(THREE);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? Was three"] }, "");
    notes.addNote(`${CAMPAIGN}/Questions/Session 4.md`, { session: "[[Session 4]]", lines: ["? Was four"] }, "");
    const { mover } = moverWith(notes);
    mover.sessionRenamed(THREE, TWO);
    mover.sessionRenamed(`${CAMPAIGN}/Sessions/Session 4.md`, THREE);
    await settled();
    await settled();
    expect(notes.noteAt(Q2)?.properties?.lines).toEqual(["? Was three"]);
    expect(notes.noteAt(Q3)?.properties?.lines).toEqual(["? Was four"]);
    expect(notes.noteAt(Q3)?.properties?.session).toBe(`[[${CAMPAIGN}/Sessions/Session 3]]`);
    expect(notes.said).toEqual([]);
  });

  it("moves nothing when the session's file isn't at its new place", async () => {
    const notes = new FakeNotes();
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
  });

  it("finishes each session's move before it starts the next, even when the first waits", async () => {
    const notes = new FakeNotes();
    notes.addSession(TWO);
    notes.addSession(THREE);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: ["? Was three"] }, "");
    notes.addNote(`${CAMPAIGN}/Questions/Session 4.md`, { session: "[[Session 4]]", lines: ["? Was four"] }, "");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { mover } = moverWith(notes, async (path) => {
      if (path === Q2) await held;
    });
    mover.sessionRenamed(THREE, TWO);
    mover.sessionRenamed(`${CAMPAIGN}/Sessions/Session 4.md`, THREE);
    await settled();
    release();
    await settled();
    await settled();
    expect(notes.noteAt(Q3)?.properties?.lines).toEqual(["? Was four"]);
    expect(notes.said).toEqual([]);
  });

  it("puts a note back where it was, and says so, when its session link can't be written after the move", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "His words");
    notes.failProperties = new Error("disk full");
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.noteAt(Q3)?.words).toBe("His words");
    expect(notes.noteAt(Q2)).toBeNull();
    expect(notes.said).toHaveLength(1);
    expect(firstOf(notes.said)).toContain("so it was put back");
  });

  it("says the note moved but its session link wasn't updated, and how to fix it, when it can't be put back either", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    notes.failProperties = new Error("disk full");
    notes.failRenamesFrom = 2;
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.said).toHaveLength(1);
    expect(firstOf(notes.said)).toContain(`${Q2} moved with its session, but its session link wasn't updated`);
    expect(firstOf(notes.said)).toContain("use Fix");
  });

  it("says it can't put a note back when something else took its old place meanwhile", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    notes.failProperties = new Error("disk full");
    notes.actions.processFrontMatter.mockImplementationOnce(async () => {
      notes.addNote(Q3, null, "Another note made at the old place");
      throw new Error("disk full");
    });
    moverWith(notes).mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.said).toHaveLength(1);
    expect(firstOf(notes.said)).toContain("moved with its session, but its session link wasn't updated");
  });

  it("waits for a pending write at the note's old place as well as at its new one", async () => {
    const notes = new FakeNotes();
    renumbered(notes);
    notes.addNote(Q3, { session: "[[Session 3]]", lines: [] }, "");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { mover } = moverWith(notes, async (path) => {
      if (path === Q3) await held;
    });
    mover.sessionRenamed(THREE, TWO);
    await settled();
    expect(notes.files.rename).not.toHaveBeenCalled();
    release();
    await settled();
    expect(notes.files.rename).toHaveBeenCalledOnce();
  });
});
