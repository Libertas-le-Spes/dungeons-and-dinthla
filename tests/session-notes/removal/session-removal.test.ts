import { describe, expect, it, vi } from "vitest";
import { Drafts } from "../../../src/session-notes/drafts/drafts";
import { PROPERTIES_NOT_FOUND } from "../../../src/session-notes/removal/session-clearer";
import { NOTE_GONE_NOW, SAVE_RUNNING } from "../../../src/session-notes/removal/session-removal";
import { CHANGED_SINCE_ASKED_TO_DELETE } from "../../../src/session-notes/removal/session-trash";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { SESSIONS_CHANGED_SINCE_ASKED, type RenumberingReport } from "../../../src/session-notes/renumbering/renumbering-words";
import { NOTHING_WRONG } from "../renumbering/stub-renumbering";
import { flushed, HEADING, NOTE, PATH, writingOn } from "../writing-on";

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

  it("refuses to clear if a save started while it asked", async () => {
    const { showNote, button, asked, notes, message, drafts } = writingOn(NOTE);
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    let finish = (_left: string) => {};
    const saving = drafts.save(PATH, () => new Promise<string>((resolve) => (finish = resolve)));
    asked[0]!.confirmed();
    await flushed();
    expect(message()).toBe(SAVE_RUNNING);
    expect(notes.process).not.toHaveBeenCalled();
    finish("");
    await saving;
  });

  it("refuses to delete if a save started while it asked", async () => {
    const { showNote, button, asked, message, drafts, trashFile } = writingOn(NOTE);
    showNote();
    button(".dd-delete-session").click();
    await flushed();
    let finish = (_left: string) => {};
    const saving = drafts.save(PATH, () => new Promise<string>((resolve) => (finish = resolve)));
    asked[0]!.confirmed();
    await flushed();
    expect(message()).toBe(SAVE_RUNNING);
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
    await vi.waitFor(() => expect(moves.deleted).toHaveBeenCalledExactlyOnceWith(null));
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
    await vi.waitFor(() => expect(trashFile).toHaveBeenCalledOnce());
    finish();
    await flushed();
    expect(button(".dd-delete-session").disabled).toBe(false);
  });

  it("refuses to delete and says so when the note changed since it asked", async () => {
    const { button, asked, notes, trashFile, moves, message } = writingOn(NOTE);
    button(".dd-delete-session").click();
    await flushed();
    notes.text = `${NOTE}\n! Ride to Thessaly`;
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(message()).toBe(`Couldn't delete the session: ${CHANGED_SINCE_ASKED_TO_DELETE}`));
    expect(trashFile).not.toHaveBeenCalled();
    expect(moves.deleted).not.toHaveBeenCalled();
    expect(notes.text).toBe(`${NOTE}\n! Ride to Thessaly`);
  });

  it("refuses to delete a note made again at the same path since it asked, even with the same text", async () => {
    const { button, asked, notes, trashFile, moves, message } = writingOn(NOTE);
    button(".dd-delete-session").click();
    await flushed();
    notes.makeAgain(NOTE);
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(message()).toBe(`Couldn't delete the session: ${CHANGED_SINCE_ASKED_TO_DELETE}`));
    expect(trashFile).not.toHaveBeenCalled();
    expect(moves.deleted).not.toHaveBeenCalled();
  });

  it("warns that the note can't be taken back when Obsidian deletes files permanently", async () => {
    const { button, asked, permanently } = writingOn(TWO_LINES);
    permanently.mockReturnValue(true);
    button(".dd-delete-session").click();
    await flushed();
    expect(asked[0]!.text.body).toBe(
      "Its 2 notes go with it, including any questions, quests and ledger lines first written in it. Other sessions, and values learned on character sheets, stay. Obsidian is set to delete files permanently, so the note can't be taken back from a trash.",
    );
  });

  it("opens no second dialog while one is open, and asks again once it is answered", async () => {
    const { showNote, button, asked } = writingOn(NOTE);
    showNote();
    button(".dd-clear-notes").click();
    button(".dd-delete-session").click();
    await flushed();
    button(".dd-delete-session").click();
    await flushed();
    expect(asked.map((ask) => ask.text.confirm)).toEqual(["Clear notes"]);
    asked[0]!.kept();
    button(".dd-delete-session").click();
    await flushed();
    expect(asked.map((ask) => ask.text.confirm)).toEqual(["Clear notes", "Delete session"]);
  });

  it("clears once when a confirmation arrives again while the clearing runs", async () => {
    const { showNote, button, confirm, notes } = writingOn(NOTE);
    showNote();
    confirm.mockImplementationOnce((_text, confirmed, closed) => {
      closed();
      confirmed();
      confirmed();
    });
    button(".dd-clear-notes").click();
    await vi.waitFor(() => expect(notes.writes).toHaveLength(1));
    await flushed();
    expect(notes.process).toHaveBeenCalledOnce();
  });

  it("holds the add-lines box's Save while a removal runs, and writes no lines", async () => {
    const { showNote, button, asked, notes, typeLines, writer, root } = writingOn(NOTE);
    showNote();
    let finish = () => {};
    notes.process.mockImplementationOnce(() => new Promise<string>((resolve) => (finish = () => resolve(""))));
    typeLines("! Ride to Thessaly");
    button(".dd-clear-notes").click();
    await flushed();
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(notes.process).toHaveBeenCalledOnce());
    const box = root.querySelector<HTMLTextAreaElement>(".dd-writing-panel textarea")!;
    expect(button(".dd-writing-panel .dd-save").disabled).toBe(true);
    box.dispatchEvent(new box.ownerDocument.defaultView!.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
    await flushed();
    expect(writer.save).not.toHaveBeenCalled();
    finish();
    await vi.waitFor(() => expect(button(".dd-writing-panel .dd-save").disabled).toBe(false));
  });

  it("refuses to clear and says so when the note starts with --- but has no properties block", async () => {
    const unclosed = "---\nplayed: 2026-11-09\nTracks lead to the [[Old Mill]].";
    const { showNote, button, asked, notes, message } = writingOn(unclosed);
    showNote();
    button(".dd-clear-notes").click();
    await flushed();
    asked[0]!.confirmed();
    await vi.waitFor(() => expect(message()).toBe(`Couldn't clear the notes: ${PROPERTIES_NOT_FOUND}`));
    expect(notes.writes).toEqual([]);
    expect(notes.text).toBe(unclosed);
  });
});

function rename(from: number, to: number): SessionRename {
  return { from: `Pale Moon/Sessions/Session ${from}.md`, to: `Pale Moon/Sessions/Session ${to}.md`, fromNumber: from, toNumber: to };
}

const OTHERS_STAY = "Other sessions, and values learned on character sheets, stay.";

interface AskedDialog {
  text: { body: string };
  confirmed: () => void;
}

function firstAsked(asked: AskedDialog[]): AskedDialog {
  const [first] = asked;
  if (first === undefined) throw new Error("Nothing was asked.");
  return first;
}

function pressConfirm(asked: AskedDialog[]): void {
  firstAsked(asked).confirmed();
}

function bodyAsked(asked: AskedDialog[]): string {
  return firstAsked(asked).text.body;
}

function firstCallOrder(mock: { mock: { invocationCallOrder: number[] } }): number {
  const [first] = mock.mock.invocationCallOrder;
  if (first === undefined) throw new Error("It was never called.");
  return first;
}

describe("Delete session, with the sessions numbered again", () => {
  it("names the sessions that move when it asks, after what it always says", async () => {
    const { button, asked, renumbering } = writingOn("? Who sent the letter");
    renumbering.planFor.mockReturnValue({ campaignFolder: "Pale Moon", renames: [rename(5, 2), rename(7, 3)], latest: null });
    button(".dd-delete-session").click();
    await flushed();
    expect(bodyAsked(asked)).toBe(`Its 1 note goes with it, including any question, quest or ledger line first written in it. ${OTHERS_STAY} Sessions 5 and 7 become 2 and 3.`);
  });

  it("names the sessions that move before it warns the note can't be taken back", async () => {
    const { button, asked, renumbering, permanently } = writingOn("? Who sent the letter");
    permanently.mockReturnValue(true);
    renumbering.planFor.mockReturnValue({ campaignFolder: "Pale Moon", renames: [rename(5, 4)], latest: null });
    button(".dd-delete-session").click();
    await flushed();
    expect(bodyAsked(asked)).toBe(
      `Its 1 note goes with it, including any question, quest or ledger line first written in it. ${OTHERS_STAY} Session 5 becomes 4. Obsidian is set to delete files permanently, so the note can't be taken back from a trash.`,
    );
  });

  it("asks for the plan of the session being deleted", async () => {
    const { button, renumbering } = writingOn(NOTE);
    button(".dd-delete-session").click();
    await flushed();
    expect(renumbering.planFor).toHaveBeenCalledExactlyOnceWith(PATH);
  });

  it("asks nothing and says why when the sessions can't be numbered again, and can ask again after", async () => {
    const { button, asked, renumbering, message, trashFile } = writingOn(NOTE);
    renumbering.planFor.mockReturnValueOnce({ error: "Two session notes are numbered 3. Nothing was deleted." });
    button(".dd-delete-session").click();
    await flushed();
    expect(asked).toEqual([]);
    expect(message()).toBe("Two session notes are numbered 3. Nothing was deleted.");
    expect(trashFile).not.toHaveBeenCalled();
    button(".dd-delete-session").click();
    await flushed();
    expect(asked).toHaveLength(1);
  });

  it("checks the plan again before the note goes to the trash, with the plan it asked about", async () => {
    const { button, asked, renumbering, trashFile } = writingOn(NOTE);
    const plan = { campaignFolder: "Pale Moon", renames: [rename(5, 2)], latest: "Pale Moon/Sessions/Session 2.md" };
    renumbering.planFor.mockReturnValue(plan);
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(trashFile).toHaveBeenCalledOnce());
    expect(renumbering.confirmed).toHaveBeenCalledExactlyOnceWith(PATH, plan);
  });

  it("deletes nothing and says why when the plan no longer holds", async () => {
    const stubbed = writingOn(NOTE);
    stubbed.renumbering.confirmed.mockImplementation(() => {
      throw new Error(SESSIONS_CHANGED_SINCE_ASKED);
    });
    stubbed.button(".dd-delete-session").click();
    await flushed();
    pressConfirm(stubbed.asked);
    await vi.waitFor(() => expect(stubbed.message()).toBe(`Couldn't delete the session: ${SESSIONS_CHANGED_SINCE_ASKED}`));
    expect(stubbed.trashFile).not.toHaveBeenCalled();
    expect(stubbed.renumbering.carryOut).not.toHaveBeenCalled();
    expect(stubbed.moves.deleted).not.toHaveBeenCalled();
  });

  it("numbers the sessions again once the note is in the trash, then moves on to the latest session", async () => {
    const { button, asked, renumbering, trashFile, moves } = writingOn(NOTE);
    const plan = { campaignFolder: "Pale Moon", renames: [rename(5, 2)], latest: "Pale Moon/Sessions/Session 2.md" };
    renumbering.planFor.mockReturnValue(plan);
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(moves.deleted).toHaveBeenCalledExactlyOnceWith("Pale Moon/Sessions/Session 2.md"));
    expect(renumbering.carryOut).toHaveBeenCalledExactlyOnceWith(plan);
    expect(firstCallOrder(trashFile)).toBeLessThan(firstCallOrder(renumbering.carryOut));
  });

  it("sets the box's lines aside before any session is renamed", async () => {
    const { button, asked, renumbering, keptDrafts, typeLines } = writingOn(NOTE);
    typeLines("! Ride to Thessaly");
    let keptWhenRenaming: string[] = [];
    renumbering.carryOut.mockImplementation(async () => {
      keptWhenRenaming = keptDrafts.kept().map((kept) => kept.text);
      return NOTHING_WRONG;
    });
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(renumbering.carryOut).toHaveBeenCalledOnce());
    expect(keptWhenRenaming).toEqual(["! Ride to Thessaly"]);
  });

  it("tells the person what went wrong with the renumbering, and still moves on", async () => {
    const report: RenumberingReport = { ...NOTHING_WRONG, linksNotUpdated: ["Pale Moon/Notes.md (the disk is full.)"] };
    const { button, asked, renumbering, report: tell, moves } = writingOn(NOTE);
    renumbering.carryOut.mockResolvedValue(report);
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(moves.deleted).toHaveBeenCalledOnce());
    expect(tell).toHaveBeenCalledExactlyOnceWith("Links weren't updated in: Pale Moon/Notes.md (the disk is full.).");
  });

  it("tells the person nothing when the renumbering went through", async () => {
    const { button, asked, report: tell, moves } = writingOn(NOTE);
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(moves.deleted).toHaveBeenCalledOnce());
    expect(tell).not.toHaveBeenCalled();
  });

  it("doesn't number the sessions again when the note can't be trashed", async () => {
    const { button, asked, renumbering, trashFile, message } = writingOn(NOTE);
    trashFile.mockRejectedValueOnce(new Error("the trash is full."));
    button(".dd-delete-session").click();
    await flushed();
    pressConfirm(asked);
    await vi.waitFor(() => expect(message()).toBe("Couldn't delete the session: the trash is full."));
    expect(renumbering.carryOut).not.toHaveBeenCalled();
  });
});
