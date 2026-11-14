import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { NewImportFlow } from "../../../src/imports/dialog/flows/new-import-flow";
import { UpdateFlow } from "../../../src/imports/dialog/flows/update-flow";
import { ImportWriter } from "../../../src/imports/note/writing/import-writer";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { printedOf } from "../../beyond/builders/sheet-reading";
import { Notice } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { HeldCalls } from "../../stubs/held-calls";
import { CAMPAIGN_FOLDER, CHARACTERS_FOLDER, FakeNoteVault } from "../builders/fake-note-vault";
import { DialogDriver, pickedFileOf } from "../builders/dialog-driver";
import { NO_ONLINE } from "../builders/made-up-online";
import { madeUpPdf, notAPdf } from "../builders/made-up-pdf";
import { TODAY } from "../builders/made-up-import";
import { READING_WENT_WRONG, WRITING_WENT_WRONG } from "../../../src/imports/dialog/failure-words";
import { typedTextNotShown } from "../../../src/imports/note/writing/guarding/refusals";
import { IMPORT_TITLE, STILL_READING, UPDATE_TITLE } from "../../../src/imports/dialog/import-words";
import type { Modal as StubModal } from "../../stubs/obsidian";
import { queuedWorkRan } from "../../stubs/queued-work";
import { SettleWatch } from "../../stubs/settle-watch";

const TYPED_TEXT_NOT_SHOWN = typedTextNotShown().message;

const NEW_NOTE = `${CHARACTERS_FOLDER}/Primary Monk.md`;
const SHORT_NOTE = `${CHARACTERS_FOLDER}/Primary.md`;

let vault: FakeNoteVault;

beforeEach(() => {
  vault = new FakeNoteVault();
  vault.folder(CHARACTERS_FOLDER);
  Notice.shown = [];
});

afterEach(() => {
  obsidianDocument().body.replaceChildren();
});

function monkPdf(): Uint8Array {
  return madeUpPdf(MadeUpSheet.monk());
}

function importDialog(): DialogDriver {
  const writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER, CAMPAIGN_FOLDER);
  return new DialogDriver(new NewImportFlow(writer, CHARACTERS_FOLDER, vault.allNotes.bind(vault)), TODAY, NO_ONLINE);
}

function updateDialog(path: string): DialogDriver {
  const writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER, CAMPAIGN_FOLDER);
  return new DialogDriver(new UpdateFlow(writer, vault.fileAt(path)), TODAY, NO_ONLINE);
}

function monkNoteText(before: string): string {
  return importedNoteText(before, printedOf(MadeUpSheet.monk()), TODAY);
}

describe("the import dialog's own work, which its tests await", () => {
  it("counts a file still being read as work not yet done", async () => {
    const bytes = new HeldCalls<ArrayBuffer>();
    const dialog = importDialog();
    dialog.pick({ size: 10, arrayBuffer: bytes.hold.bind(bytes) });
    const watch = new SettleWatch(dialog.modal.allSettled());
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    bytes.resolve(0, new Uint8Array(monkPdf()).buffer);
    await watch.done;
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
  });

  it("counts a note still being read for the review as work not yet done", async () => {
    vault.note(NEW_NOTE, "Notes of mine.\n");
    const reads = vault.holdReads();
    const dialog = updateDialog(NEW_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await reads.made(1);
    const watch = new SettleWatch(dialog.modal.allSettled());
    await queuedWorkRan();
    expect(watch.settled).toBe(false);
    reads.resolve(0, "Notes of mine.\n");
    await watch.done;
    expect(dialog.texts(".dd-import-write")).toHaveLength(1);
  });
});

describe("importing a character from a made-up PDF", () => {
  it("asks for the PDF first, saying where D&D Beyond makes it", () => {
    const dialog = importDialog();
    expect(dialog.texts(".dd-where")).toEqual(["On D&D Beyond: open your character, choose Manage next to the name, then Export to PDF at the bottom of the menu. Then choose that file here."]);
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
  });

  it("reads the PDF, shows what comes in, and makes the note on Import", async () => {
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-import-summary h3")).toEqual(["Primary Monk"]);
    expect(dialog.texts(".dd-import-summary p")).toContain("Human · Monk 4");
    expect(dialog.texts(".dd-import-summary p")).toContain("The PDF doesn't give proficiency marks, attacks, alignment, spell slots, total level, hit dice or carrying capacity, so none of them come in.");
    expect(dialog.texts(".dd-where")).toEqual(["Make a new note, Primary Monk"]);
    expect(vault.created).toEqual([]);
    dialog.press("Import");
    await dialog.modal.allSettled();
    expect(closedWith(dialog)).toEqual([[NEW_NOTE]]);
    expect(vault.created).toEqual([NEW_NOTE]);
    expect(vault.textAt(NEW_NOTE)).toBe(monkNoteText(""));
  });

  it("offers a note named for the first words of the name, and a new note, before showing anything else", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-target");
    expect(dialog.texts(".dd-import-target")).toEqual(["Update Primary", "Make a new note, Primary Monk"]);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
  });

  it("offers no note in a folder inside the Characters folder", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Old/Primary.md`, "Notes of mine.\n");
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-where")).toEqual(["Make a new note, Primary Monk"]);
    expect(dialog.root.querySelector(".dd-import-target")).toBeNull();
  });

  it("shows the note's refusal in words, and offers no Update, when the note can't take an import", async () => {
    vault.note(SHORT_NOTE, "## Spells (from D&D Beyond)\n- One\n## Spells (from D&D Beyond)\n- Two\n");
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe('The note has two "## Spells (from D&D Beyond)" sections, so nothing was written. Remove one.');
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
    expect(vault.processed).toEqual([]);
  });

  it("lists every value an update of that note would replace, and writes exactly the import on Update", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-target");
    dialog.press("Update Primary");
    await dialog.settled(".dd-import-write");
    expect(dialog.texts(".dd-import-properties li")).toContain("class: nothing → \"Monk 4\"");
    expect(dialog.texts(".dd-import-heading")).toContain("## Spells (from D&D Beyond)");
    expect(dialog.root.querySelector(".dd-import-warning")).toBeNull();
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(closedWith(dialog)).toEqual([[SHORT_NOTE]]);
    expect(vault.textAt(SHORT_NOTE)).toBe(monkNoteText("Notes of mine.\n"));
    expect(vault.created).toEqual([]);
  });

  it("warns before replacing text typed inside a section, and replaces it only after Update", async () => {
    const typed = "Notes of mine.\n## Spells (from D&D Beyond)\nRange: 60 feet\n";
    vault.note(SHORT_NOTE, typed);
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-warning");
    expect(dialog.texts(".dd-import-warning p")).toEqual(["Text you typed inside these sections will be replaced:", "## Spells (from D&D Beyond)"]);
    expect(dialog.texts(".dd-import-warning li")).toEqual(["Range: 60 feet"]);
    expect(vault.textAt(SHORT_NOTE)).toBe(typed);
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(closedWith(dialog)).toEqual([[SHORT_NOTE]]);
    expect(vault.textAt(SHORT_NOTE)).not.toContain("Range: 60 feet");
  });

  it("refuses in words when the note changed since the changes were shown, shows the new changes under the refusal, and offers Update again", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    vault.texts.set(SHORT_NOTE, "Notes of mine.\n## Spells (from D&D Beyond)\nTyped later\n");
    dialog.press("Update");
    const failure = await dialog.settled(".dd-import-failure");
    expect(failure.textContent).toBe(TYPED_TEXT_NOT_SHOWN);
    expect(vault.processed).toEqual([]);
    expect(dialog.texts(".dd-import-warning li")).toEqual(["Typed later"]);
    expect(dialog.root.querySelector(".dd-import-write")).not.toBeNull();
    expect(dialog.closed).not.toHaveBeenCalled();
  });

  it("writes on the second Update, once the typed text it now warns about is the text in the note", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    vault.texts.set(SHORT_NOTE, "Notes of mine.\n## Spells (from D&D Beyond)\nTyped later\n");
    dialog.press("Update");
    await dialog.settled(".dd-import-failure");
    dialog.press("Update");
    await dialog.modal.allSettled();
    expect(closedWith(dialog)).toEqual([[SHORT_NOTE]]);
    expect(vault.textAt(SHORT_NOTE)).not.toContain("Typed later");
  });

  it("says nothing would change for a note already up to date, and offers no Update", async () => {
    vault.note(SHORT_NOTE, monkNoteText("Notes of mine.\n"));
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-nothing");
    expect(dialog.texts(".dd-import-nothing")).toEqual(["Nothing in the note would change."]);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
    dialog.press("Close");
    expect(dialog.closed).toHaveBeenCalledWith(null);
  });

  it("shows the reader's refusal in words for a file that isn't a PDF, and asks again", async () => {
    const dialog = importDialog();
    dialog.pick(pickedFileOf(notAPdf()));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("This is not a PDF file, so it was not read.");
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(vault.created).toEqual([]);
  });

  it("shows the sheet's refusal in words for a PDF with no character name", async () => {
    const dialog = importDialog();
    dialog.pick(pickedFileOf(madeUpPdf(MadeUpSheet.monk().without("CharacterName"))));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("The sheet's character name is missing, blank or not text.");
  });

  it("refuses a file over the size limit without reading it", async () => {
    const dialog = importDialog();
    const huge = { size: 10 * 1024 * 1024 + 1, arrayBuffer: pickedFileOf(monkPdf()).arrayBuffer };
    dialog.pick(huge);
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("This file is bigger than 10 MB, so it was not read.");
    expect(huge.arrayBuffer).not.toHaveBeenCalled();
  });

  it("reads a file of exactly the size limit", async () => {
    const dialog = importDialog();
    const atTheLimit = { size: 10 * 1024 * 1024, arrayBuffer: pickedFileOf(monkPdf()).arrayBuffer };
    dialog.pick(atTheLimit);
    await dialog.settled(".dd-import-write");
    expect(atTheLimit.arrayBuffer).toHaveBeenCalledOnce();
  });

  it("says so when the file can't be read", async () => {
    const dialog = importDialog();
    dialog.pick({ size: 10, arrayBuffer: failingRead });
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("The file could not be read, so nothing was imported.");
  });

  it("is refused by the gate for a Characters folder outside the Campaigns folder, and writes nothing", async () => {
    const writer = new ImportWriter(vault.gate, "Private/Characters", "Private");
    const dialog = new DialogDriver(new NewImportFlow(writer, "Private/Characters", vault.allNotes.bind(vault)), TODAY, NO_ONLINE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    dialog.press("Import");
    const failure = await dialog.settled(".dd-import-failure");
    expect(failure.textContent).toBe(WRITING_WENT_WRONG);
    expect(vault.created).toEqual([]);
    expect(vault.createdFolders).toEqual([]);
    expect(dialog.closed).not.toHaveBeenCalled();
  });

  it("stays on the file picker when it closes with no file chosen", async () => {
    const dialog = importDialog();
    dialog.pickNothing();
    await queuedWorkRan();
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(dialog.root.querySelector(".dd-import-reading")).toBeNull();
    expect(dialog.root.querySelector(".dd-import-refusal")).toBeNull();
  });

  it("goes back to the file picker on Choose another file", async () => {
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    dialog.press("Choose another file");
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
  });
});

async function failingRead(): Promise<ArrayBuffer> {
  throw new Error("The disk went away.");
}

function closedWith(dialog: DialogDriver): unknown[][] {
  return dialog.closed.mock.calls;
}

describe("the import dialog's words when something other than a refusal goes wrong", () => {
  it("shows a plain sentence, not the error's own words, when the note can't be read", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    vault.failReadsWith(new Error("EIO: i/o error, read"));
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe(READING_WENT_WRONG);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
  });

  it("shows a plain sentence, in the dialog and the notice, when making the note fails", async () => {
    vault.failCreatesWith(new Error("File already exists."));
    const dialog = importDialog();
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    dialog.press("Import");
    const failure = await dialog.settled(".dd-import-failure");
    expect(failure.textContent).toBe(WRITING_WENT_WRONG);
    expect(Notice.shown).toEqual([`Couldn't write the import: ${WRITING_WENT_WRONG}`]);
    expect(WRITING_WENT_WRONG).toBe("Something went wrong while writing the note. Look at the note before you try again.");
    expect(READING_WENT_WRONG).toBe("Something went wrong while reading the note, so nothing was written.");
  });
});

describe("Update from D&D Beyond with another character's PDF", () => {
  it("refuses in plain words before showing any change, and changes nothing", async () => {
    vault.note(`${CHARACTERS_FOLDER}/Secondary.md`, "Notes of mine.\n");
    const dialog = updateDialog(`${CHARACTERS_FOLDER}/Secondary.md`);
    dialog.pick(pickedFileOf(monkPdf()));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("This PDF is for Primary Monk, not Secondary. Nothing was changed.");
    expect(dialog.root.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(vault.processed).toEqual([]);
  });
});

describe("a new note whose name is taken", () => {
  it("is refused in the review, before any Import button", async () => {
    vault.note(`${CHARACTERS_FOLDER}/primary monk.md`, "Notes of mine.\n");
    const dialog = new DialogDriver(new NewImportFlow(new ImportWriter(vault.gate, CHARACTERS_FOLDER, CAMPAIGN_FOLDER), CHARACTERS_FOLDER, noNotes), TODAY, NO_ONLINE);
    dialog.pick(pickedFileOf(monkPdf()));
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toBe("There is already a note called primary monk in the Characters folder.");
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
    expect(vault.created).toEqual([]);
  });
});

describe("the dialog's title and first focus", () => {
  it("is titled Import from D&D Beyond for a new character", () => {
    const dialog = importDialog();
    expect(titleOf(dialog)).toBe(IMPORT_TITLE);
    expect(IMPORT_TITLE).toBe("Import from D&D Beyond");
  });

  it("is titled Update from D&D Beyond for a note", () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = updateDialog(SHORT_NOTE);
    expect(titleOf(dialog)).toBe(UPDATE_TITLE);
    expect(UPDATE_TITLE).toBe("Update from D&D Beyond");
  });

  it("puts the focus on the box for the link", () => {
    const dialog = importDialog();
    expect(dialog.root.ownerDocument.activeElement).toBe(dialog.root.querySelector(".setting-item-control input"));
  });
});

function noNotes(): TFile[] {
  return [];
}

function titleOf(dialog: DialogDriver): string {
  return (dialog.modal as unknown as StubModal).title;
}

