import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NewImportFlow } from "../../../src/imports/dialog/flows/new-import-flow";
import { UpdateFlow } from "../../../src/imports/dialog/flows/update-flow";
import { ImportWriter } from "../../../src/imports/note/writing/import-writer";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { MadeUpSheet } from "../../beyond/builders/made-up-sheet";
import { printedOf } from "../../beyond/builders/sheet-reading";
import { Notice } from "../../stubs/obsidian";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { CHARACTERS_FOLDER, FakeNoteVault } from "../builders/fake-note-vault";
import { DialogDriver, pickedFileOf } from "../builders/dialog-driver";
import { madeUpPdf, notAPdf } from "../builders/made-up-pdf";
import { TODAY } from "../builders/made-up-import";

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
  const writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER);
  return new DialogDriver(new NewImportFlow(writer, CHARACTERS_FOLDER, vault.allNotes.bind(vault)), TODAY);
}

function updateDialog(path: string): DialogDriver {
  const writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER);
  return new DialogDriver(new UpdateFlow(writer, vault.fileAt(path)), TODAY);
}

function monkNoteText(before: string): string {
  return importedNoteText(before, printedOf(MadeUpSheet.monk()), TODAY);
}

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
    await expect.poll(closedWith(dialog)).toEqual([[NEW_NOTE]]);
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
    await expect.poll(closedWith(dialog)).toEqual([[SHORT_NOTE]]);
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
    await expect.poll(closedWith(dialog)).toEqual([[SHORT_NOTE]]);
    expect(vault.textAt(SHORT_NOTE)).not.toContain("Range: 60 feet");
  });

  it("refuses in words, and writes nothing, when the note changed since the changes were shown", async () => {
    vault.note(SHORT_NOTE, "Notes of mine.\n");
    const dialog = updateDialog(SHORT_NOTE);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    vault.texts.set(SHORT_NOTE, "Notes of mine.\n## Spells (from D&D Beyond)\nTyped later\n");
    dialog.press("Update");
    const refusal = await dialog.settled(".dd-import-refusal");
    expect(refusal.textContent).toContain("is not the text that was shown before, so nothing was written");
    expect(vault.processed).toEqual([]);
    expect(dialog.root.querySelector(".dd-import-write")).toBeNull();
    expect(dialog.closed).not.toHaveBeenCalled();
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
    expect(refusal.textContent).toBe("The file could not be read, so nothing was read.");
  });

  it("is refused by the gate for a Characters folder outside the Campaigns folder, and writes nothing", async () => {
    const writer = new ImportWriter(vault.gate, "Private/Characters");
    const dialog = new DialogDriver(new NewImportFlow(writer, "Private/Characters", vault.allNotes.bind(vault)), TODAY);
    dialog.pick(pickedFileOf(monkPdf()));
    await dialog.settled(".dd-import-write");
    dialog.press("Import");
    await dialog.settled(".dd-import-refusal");
    expect(vault.created).toEqual([]);
    expect(vault.createdFolders).toEqual([]);
    expect(dialog.closed).not.toHaveBeenCalled();
  });

  it("stays on the file picker when it closes with no file chosen", async () => {
    const dialog = importDialog();
    dialog.pickNothing();
    await Promise.resolve();
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

function closedWith(dialog: DialogDriver): () => unknown[][] {
  return function calls(): unknown[][] {
    return dialog.closed.mock.calls;
  };
}
