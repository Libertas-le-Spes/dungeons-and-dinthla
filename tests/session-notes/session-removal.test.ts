import { describe, expect, it, vi } from "vitest";
import { Drafts } from "../../src/session-notes/drafts";
import { NOTE_GONE_NOW, SAVE_RUNNING } from "../../src/session-notes/session-removal";
import { flushed, HEADING, NOTE, PATH, writingOn } from "./writing-on";

const TWO_LINES = "Tracks lead to the [[Old Mill]].\n? Who sent the letter";

describe("Clear notes and Delete session", () => {
  it("can't clear a session with no lines, and can delete it", () => {
    const { showNote, button } = writingOn("---\nplayed: 2026-11-09\n---\n\n");
    showNote();
    expect(button(".dd-clear-notes").disabled).toBe(true);
    expect(button(".dd-delete-session").disabled).toBe(false);
  });

  it("can clear and delete a session with lines", () => {
    const { showNote, button } = writingOn(NOTE);
    showNote();
    expect(button(".dd-clear-notes").disabled).toBe(false);
    expect(button(".dd-delete-session").disabled).toBe(false);
  });

  it("can neither clear nor delete while a save runs", async () => {
    const { showNote, button, drafts } = writingOn(NOTE);
    showNote();
    let finish = (_left: string) => {};
    const saving = drafts.save(PATH, () => new Promise<string>((resolve) => (finish = resolve)));
    expect(button(".dd-clear-notes").disabled).toBe(true);
    expect(button(".dd-delete-session").disabled).toBe(true);
    finish("");
    await saving;
    expect(button(".dd-clear-notes").disabled).toBe(false);
    expect(button(".dd-delete-session").disabled).toBe(false);
  });

  it("asks before clearing, naming the session and how many lines go", async () => {
    const { showNote, button, asked, moves } = writingOn(`---\nplayed: 2026-11-09\n---\n${TWO_LINES}`);
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    expect(moves.heading).toHaveBeenCalled();
    expect(asked.map((ask) => ask.text)).toEqual([
      {
        title: `Clear the notes of ${HEADING}?`,
        body: "Its 2 notes go, including any questions, quests and ledger lines first written in them. The session and its properties stay.",
        confirm: "Clear notes",
        keep: "Keep notes",
      },
    ]);
  });

  it("names a single line as one note when clearing", async () => {
    const { showNote, button, asked } = writingOn("? Who sent the letter");
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    expect(asked[0]!.text.body).toBe("Its 1 note goes, with any question, quest or ledger line first written in it. The session and its properties stay.");
  });

  it("changes nothing when clearing is not confirmed", async () => {
    const { showNote, button, asked, notes } = writingOn(NOTE);
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    expect(asked).toHaveLength(1);
    expect(notes.process).not.toHaveBeenCalled();
    expect(notes.text).toBe(NOTE);
  });

  it("empties the note below its properties once confirmed, keeping the properties exactly", async () => {
    const { showNote, button, asked, notes } = writingOn("---\r\nplayed: 2026-11-09\r\n---\r\nTracks\r\n? Who");
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(notes.process).toHaveBeenCalledOnce());
    expect(notes.writes).toEqual(["---\r\nplayed: 2026-11-09\r\n---\r\n"]);
  });

  it("refuses to clear and says so when the note changed since it asked", async () => {
    const { showNote, button, asked, notes, message } = writingOn(NOTE);
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    notes.text = `${NOTE}\n! Ride to Thessaly`;
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(message()).toBe("Couldn't clear the notes: the session's note changed since you were asked, so nothing was cleared. Look at its notes again first."));
    expect(notes.writes).toEqual([]);
    expect(notes.text).toBe(`${NOTE}\n! Ride to Thessaly`);
  });

  it("refuses to clear or delete if a save started while it asked", async () => {
    const { showNote, button, asked, notes, message, drafts, trashFile } = writingOn(NOTE);
    showNote();
    button(".dd-clear-notes").click();
    button(".dd-delete-session").click();
    await flushed();
    let finish = (_left: string) => {};
    const saving = drafts.save(PATH, () => new Promise<string>((resolve) => (finish = resolve)));
    asked[0]!.confirmed();
    asked[1]!.confirmed();
    await flushed();
    expect(message()).toBe(SAVE_RUNNING);
    expect(notes.process).not.toHaveBeenCalled();
    expect(trashFile).not.toHaveBeenCalled();
    finish("");
    await saving;
  });

  it("asks before deleting with the prototype's words, for many notes, one or none", async () => {
    const many = writingOn(TWO_LINES);
    many.button(".dd-delete-session").click();
    const one = writingOn("? Who sent the letter");
    one.button(".dd-delete-session").click();
    const none = writingOn("---\nplayed: 2026-11-09\n---\n");
    none.button(".dd-delete-session").click();
    await flushed();
    expect(many.asked[0]!.text).toEqual({
      title: `Delete ${HEADING}?`,
      body: "Its 2 notes go with it, including any questions, quests and ledger lines first written in it. Other sessions, and values learned on character sheets, stay.",
      confirm: "Delete session",
      keep: "Keep session",
    });
    expect(one.asked[0]!.text.body).toBe(
      "Its 1 note goes with it, including any question, quest or ledger line first written in it. Other sessions, and values learned on character sheets, stay.",
    );
    expect(none.asked[0]!.text.body).toBe("It has no notes. Other sessions, and values learned on character sheets, stay.");
  });

  it("changes nothing when deleting is not confirmed", async () => {
    const { button, asked, trashFile, moves, keptDrafts, typeLines } = writingOn(NOTE);
    typeLines("! Ride to Thessaly");
    button(".dd-delete-session").click();
    await flushed();
    expect(asked).toHaveLength(1);
    expect(trashFile).not.toHaveBeenCalled();
    expect(moves.deleted).not.toHaveBeenCalled();
    expect(keptDrafts.kept()).toEqual([]);
  });

  it("moves the note to Obsidian's trash once confirmed, keeps unsaved lines apart, and moves on", async () => {
    const drafts = new Drafts({}, () => {});
    const { button, asked, trashFile, moves, keptDrafts, typeLines } = writingOn(NOTE, drafts);
    typeLines("! Ride to Thessaly");
    button(".dd-delete-session").click();
    await flushed();
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(moves.deleted).toHaveBeenCalledExactlyOnceWith(PATH));
    expect(trashFile).toHaveBeenCalledExactlyOnceWith({ path: PATH });
    expect(keptDrafts.kept().map((kept) => [kept.path, kept.text])).toEqual([[PATH, "! Ride to Thessaly"]]);
    expect(drafts.textOf(PATH)).toBe("");
  });

  it("says why when the note can't be moved to the trash, and keeps the lines in the box", async () => {
    const { button, asked, trashFile, moves, keptDrafts, typeLines, message, drafts } = writingOn(NOTE);
    trashFile.mockRejectedValueOnce(new Error("the trash is full."));
    typeLines("! Ride to Thessaly");
    button(".dd-delete-session").click();
    await flushed();
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(message()).toBe("Couldn't delete the session: the trash is full."));
    expect(moves.deleted).not.toHaveBeenCalled();
    expect(keptDrafts.kept()).toEqual([]);
    expect(drafts.textOf(PATH)).toBe("! Ride to Thessaly");
  });

  it("asks nothing and says so when the note is already gone", async () => {
    const { button, asked, message } = writingOn(null);
    button(".dd-delete-session").click();
    button(".dd-clear-notes").click();
    await flushed();
    expect(asked).toEqual([]);
    expect(message()).toBe(NOTE_GONE_NOW);
  });

  it("can neither clear nor delete while one runs", async () => {
    const { showNote, button, asked, trashFile } = writingOn(NOTE);
    showNote();
    let finish = () => {};
    trashFile.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
    button(".dd-delete-session").click();
    await flushed();
    asked[0]!.confirmed();
    expect(button(".dd-clear-notes").disabled).toBe(true);
    expect(button(".dd-delete-session").disabled).toBe(true);
    finish();
    await flushed();
    expect(button(".dd-delete-session").disabled).toBe(false);
  });
});
