import { beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { ImportWriter } from "../../../../src/imports/note/writing/import-writer";
import * as importedNote from "../../../../src/imports/note/writing/imported-note";
import { CHARACTERS_FOLDER, FakeNoteVault } from "../../builders/fake-note-vault";
import { monkSheet, sheetWithCharacter, TODAY } from "../../builders/made-up-import";
import { headingsOf, textOf } from "../../builders/line-helpers";

const NOTE = `${CHARACTERS_FOLDER}/Primary Monk.md`;

let vault: FakeNoteVault;
let writer: ImportWriter;

beforeEach(() => {
  vault = new FakeNoteVault();
  vault.folder(CHARACTERS_FOLDER);
  writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER);
});

describe("ImportWriter.update", () => {
  it("writes the import into the note and keeps his words", async () => {
    const file = vault.note(NOTE, "His words.\n");
    await writer.update(file, monkSheet(), TODAY);
    expect(vault.textAt(NOTE)).toContain("His words.\n");
    expect(headingsOf(vault.textAt(NOTE)).length).toBe(5);
  });

  it("writes through the gate's process, once, for the note named", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), TODAY);
    expect(vault.processed).toEqual([NOTE]);
  });

  it("writes nothing new when the note already holds the same import", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), "2026-01-02");
    const first = vault.textAt(NOTE);
    await writer.update(file, monkSheet(), TODAY);
    expect(vault.textAt(NOTE)).toBe(first);
  });

  it("writes the new date when something else changed", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), "2026-01-02");
    const other = sheetWithCharacter(monkSheet(), { species: CleanLine.of("Elf") });
    await writer.update(file, other, TODAY);
    expect(vault.textAt(NOTE)).toContain("imported: 2026-11-13");
    expect(vault.textAt(NOTE)).toContain('species: "Elf"');
  });

  it("refuses a note outside the Characters folder and writes nothing", async () => {
    const file = vault.note("D&D/Primary Campaign/Sessions/Session 1.md", "x\n");
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow(Refusal);
    expect(vault.processed).toEqual([]);
  });

  it("refuses a note in a folder inside the Characters folder", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER}/Old/Primary Monk.md`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow(Refusal);
    expect(vault.processed).toEqual([]);
  });

  it("refuses a file that is not a Markdown note", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER}/Primary Monk.txt`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow(Refusal);
  });

  it("refuses a folder that only starts with the Characters folder's name", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER} Old/Primary Monk.md`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow(Refusal);
  });

  it("refuses, and leaves the note as it was, when the note holds a plugin section twice", async () => {
    const twice = textOf("## Inventory (from D&D Beyond)", "- a", "## Inventory (from D&D Beyond)", "- b");
    const file = vault.note(NOTE, twice);
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow("two");
    expect(vault.textAt(NOTE)).toBe(twice);
  });

  it("refuses, and leaves the note as it was, when the text it would write changes a line outside the import", async () => {
    const spy = vi.spyOn(importedNote, "importedNoteText").mockReturnValue("Other words.\n");
    const file = vault.note(NOTE, "His words.\n");
    await expect(writer.update(file, monkSheet(), TODAY)).rejects.toThrow("outside its own properties");
    expect(vault.textAt(NOTE)).toBe("His words.\n");
    spy.mockRestore();
  });

  it("is refused by the gate for a note outside the Campaigns folder, and writes nothing", async () => {
    const outside = new ImportWriter(vault.gate, "Private/Characters");
    const file = vault.note("Private/Characters/Primary Monk.md", "x\n");
    await expect(outside.update(file, monkSheet(), TODAY)).rejects.toThrow("outside the Campaigns folder");
    expect(vault.textAt("Private/Characters/Primary Monk.md")).toBe("x\n");
  });
});

describe("ImportWriter.changesFor", () => {
  it("says what the import would change, and writes nothing", async () => {
    const file = vault.note(NOTE, "x\n");
    const changes = await writer.changesFor(file, monkSheet(), TODAY);
    expect(changes.sections.length).toBe(5);
    expect(vault.processed).toEqual([]);
    expect(vault.textAt(NOTE)).toBe("x\n");
  });

  it("refuses a note outside the Characters folder", async () => {
    const file = vault.note("D&D/Primary Campaign/Sessions/Session 1.md", "x\n");
    await expect(writer.changesFor(file, monkSheet(), TODAY)).rejects.toThrow(Refusal);
  });
});

describe("ImportWriter.create", () => {
  it("makes the note named for the character, in the Characters folder, with the import in it", async () => {
    const file = await writer.create(monkSheet(), TODAY);
    expect(file.path).toBe(NOTE);
    expect(vault.textAt(NOTE)).toContain("imported-from: pdf");
    expect(vault.created).toEqual([NOTE]);
  });

  it("makes the Characters folder first when it is not there", async () => {
    const bare = new FakeNoteVault();
    await new ImportWriter(bare.gate, CHARACTERS_FOLDER).create(monkSheet(), TODAY);
    expect(bare.createdFolders).toEqual([CHARACTERS_FOLDER]);
  });

  it("does not make the folder when it is there", async () => {
    await writer.create(monkSheet(), TODAY);
    expect(vault.createdFolders).toEqual([]);
  });

  it("refuses a name a note cannot have, and makes nothing", async () => {
    const odd = sheetWithCharacter(monkSheet(), { name: CleanLine.of("Primary/Monk") });
    await expect(writer.create(odd, TODAY)).rejects.toThrow(Refusal);
    expect(vault.created).toEqual([]);
  });

  it("refuses a name that a note already has, whatever its capitals, and makes nothing", async () => {
    vault.note(`${CHARACTERS_FOLDER}/primary monk.md`, "x\n");
    await expect(writer.create(monkSheet(), TODAY)).rejects.toThrow("There is already a note called primary monk");
    expect(vault.created).toEqual([]);
  });

  it("makes nothing when the text it would write is not only the import", async () => {
    const spy = vi.spyOn(importedNote, "importedNoteText").mockReturnValue("Other words.\n");
    await expect(writer.create(monkSheet(), TODAY)).rejects.toThrow("outside its own properties");
    expect(vault.created).toEqual([]);
    spy.mockRestore();
  });

  it("makes nothing when the gate refuses the folder", async () => {
    const outside = new ImportWriter(vault.gate, "Private/Characters");
    await expect(outside.create(monkSheet(), TODAY)).rejects.toThrow();
    expect(vault.created).toEqual([]);
  });
});
