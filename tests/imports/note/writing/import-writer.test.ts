import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { OUTSIDE_FENCE } from "../../../../src/fence/paths/fence";
import type { TypedText } from "../../../../src/imports/note/changes/import-changes";
import { ImportWriter } from "../../../../src/imports/note/writing/import-writer";
import { leftPlayWords } from "../../../../src/campaign/paths/fallen-notes";
import * as importedNote from "../../../../src/imports/note/writing/rewriting/imported-note";
import { CAMPAIGN_FOLDER, CHARACTERS_FOLDER, FakeNoteVault } from "../../builders/fake-note-vault";
import { headingsOf, textOf } from "../../builders/line-helpers";
import { monkSheet, sheetWithCharacter, TODAY } from "../../builders/made-up-import";

const NOTE = `${CHARACTERS_FOLDER}/Primary Monk.md`;
const FALLEN_NOTE = `${CAMPAIGN_FOLDER}/Fallen/Primary Monk.md`;
const FROZEN_SNAPSHOT = textOf("---", "standing: died", "---", "His words.", "", "## Left play on 2026-10-01", "Died on 2026-10-01.", "### Items held", "- Rope");
const INVENTORY = "## Inventory (from D&D Beyond)";
const NONE: TypedText[] = [];

let vault: FakeNoteVault;
let writer: ImportWriter;

beforeEach(() => {
  vault = new FakeNoteVault();
  vault.folder(CHARACTERS_FOLDER);
  writer = new ImportWriter(vault.gate, CHARACTERS_FOLDER, CAMPAIGN_FOLDER);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ImportWriter.update", () => {
  it("writes the import into the note and keeps his words", async () => {
    const file = vault.note(NOTE, "His words.\n");
    await writer.update(file, monkSheet(), TODAY, NONE);
    expect(vault.textAt(NOTE)).toContain("His words.\n");
    expect(headingsOf(vault.textAt(NOTE)).length).toBe(5);
  });

  it("writes through the gate's process, once, for the note named", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), TODAY, NONE);
    expect(vault.processed).toEqual([NOTE]);
  });

  it("does not call process when the note already holds the same import", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), "2026-01-02", NONE);
    const first = vault.textAt(NOTE);
    await writer.update(file, monkSheet(), TODAY, NONE);
    expect(vault.processed).toEqual([NOTE]);
    expect(vault.textAt(NOTE)).toBe(first);
  });

  it("writes the new date when something else changed", async () => {
    const file = vault.note(NOTE, "x\n");
    await writer.update(file, monkSheet(), "2026-01-02", NONE);
    await writer.update(file, sheetWithCharacter(monkSheet(), { species: CleanLine.of("Elf") }), TODAY, NONE);
    expect(vault.textAt(NOTE)).toContain("imported: 2026-11-13");
    expect(vault.textAt(NOTE)).toContain('species: "Elf"');
    expect(vault.processed).toEqual([NOTE, NOTE]);
  });

  it("refuses a note outside the Characters folder, without reading or writing it", async () => {
    const file = vault.note("D&D/Primary Campaign/Sessions/Session 1.md", "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
    expect(vault.processed).toEqual([]);
  });

  it("writes the import into a note in the Fallen folder, leaves it there, and keeps its frozen snapshot", async () => {
    const file = vault.note(FALLEN_NOTE, FROZEN_SNAPSHOT);
    await writer.update(file, monkSheet(), TODAY, NONE);
    expect(vault.processed).toEqual([FALLEN_NOTE]);
    expect(vault.moved).toEqual([]);
    expect(vault.files.has(FALLEN_NOTE)).toBe(true);
    expect(vault.files.has(NOTE)).toBe(false);
    expect(vault.textAt(FALLEN_NOTE)).toContain("imported: 2026-11-13");
    expect(headingsOf(vault.textAt(FALLEN_NOTE)).filter((heading) => heading.startsWith("## Left play on"))).toEqual(["## Left play on 2026-10-01"]);
    expect(vault.textAt(FALLEN_NOTE)).toContain("standing: died\n");
    expect(vault.textAt(FALLEN_NOTE)).toContain(textOf("His words.", "", "## Left play on 2026-10-01", "Died on 2026-10-01.", "### Items held", "- Rope"));
  });

  it("refuses a note in another campaign's Fallen folder, without reading or writing it", async () => {
    const file = vault.note("D&D/Secondary Campaign/Fallen/Primary Monk.md", "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
    expect(vault.processed).toEqual([]);
  });

  it("refuses a note in a folder inside the Fallen folder", async () => {
    const file = vault.note(`${CAMPAIGN_FOLDER}/Fallen/Old/Primary Monk.md`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
    expect(vault.processed).toEqual([]);
  });

  it("refuses a note in a folder inside the Characters folder", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER}/Old/Primary Monk.md`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
  });

  it("refuses a file that is not a Markdown note", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER}/Primary Monk.txt`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
  });

  it("refuses a folder that only starts with the Characters folder's name", async () => {
    const file = vault.note(`${CHARACTERS_FOLDER} Old/Primary Monk.md`, "x\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
  });

  it("refuses, calls no process and leaves the note as it was, when the note holds a plugin section twice", async () => {
    const twice = textOf(INVENTORY, "- a", INVENTORY, "- b");
    const file = vault.note(NOTE, twice);
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("two");
    expect(vault.processed).toEqual([]);
    expect(vault.textAt(NOTE)).toBe(twice);
  });

  it("refuses, calls no process and leaves the note as it was, when the text it would write changes a line outside the import", async () => {
    vi.spyOn(importedNote, "importedNoteText").mockReturnValue("Other words.\n");
    const file = vault.note(NOTE, "His words.\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("outside its own properties");
    expect(vault.processed).toEqual([]);
    expect(vault.textAt(NOTE)).toBe("His words.\n");
  });

  it("is refused by the gate for a note outside the Campaigns folder, and writes nothing", async () => {
    const outside = new ImportWriter(vault.gate, "Private/Characters", "Private");
    const file = vault.note("Private/Characters/Primary Monk.md", "x\n");
    await expect(outside.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow(OUTSIDE_FENCE);
    expect(vault.processed).toEqual([]);
    expect(vault.textAt("Private/Characters/Primary Monk.md")).toBe("x\n");
  });

  it("refuses, and leaves the note as it was, when the note changed between the read and the write", async () => {
    const file = vault.note(NOTE, "Newer words.\n");
    vi.spyOn(vault.gate, "read").mockResolvedValue("Older words.\n");
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("changed since it was read");
    expect(vault.textAt(NOTE)).toBe("Newer words.\n");
  });

  it("refuses a property that only differs by capitals from the import's, and calls no process", async () => {
    const file = vault.note(NOTE, textOf("---", "ac: 3", "---", "x"));
    await expect(writer.update(file, monkSheet(), TODAY, NONE)).rejects.toThrow("only differs by capitals");
    expect(vault.processed).toEqual([]);
  });
});

describe("ImportWriter.update with text typed inside a plugin section", () => {
  const earlier = importedNote.importedNoteText("", monkSheet(), "2026-01-02");
  const changed = sheetWithCharacter(monkSheet(), { species: CleanLine.of("Elf") });

  async function typedIn(current: string): Promise<readonly TypedText[]> {
    const file = vault.note(NOTE, current);
    return (await writer.changesFor(file, changed, TODAY)).typed;
  }

  it.each([
    ["a line after the last section", `${earlier}I gave the gold to my friend\n`],
    ["a heading of level three in a section", earlier.replace("- cp · 65", "- cp · 65\n### a heading")],
    ["a setext heading after the last section", `${earlier}Notes\n-----\n`],
    ["a line after a blank line at the end", `${earlier}\nlate words\n`],
  ])("refuses %s unless it was shown, and writes nothing", async (_name, current) => {
    const typed = await typedIn(current);
    expect(typed.length).toBeGreaterThan(0);
    const file = vault.note(NOTE, current);
    await expect(writer.update(file, changed, TODAY, NONE)).rejects.toThrow("not the text that was shown");
    expect(vault.processed).toEqual([]);
    expect(vault.textAt(NOTE)).toBe(current);
  });

  it.each([
    ["a line after the last section", `${earlier}I gave the gold to my friend\n`],
    ["a setext heading after the last section", `${earlier}Notes\n-----\n`],
  ])("writes over %s once the text that was shown is given back", async (_name, current) => {
    const typed = await typedIn(current);
    const file = vault.note(NOTE, current);
    await writer.update(file, changed, TODAY, typed);
    expect(vault.textAt(NOTE)).not.toContain("Notes\n-----");
    expect(vault.textAt(NOTE)).not.toContain("gold to my friend");
    expect(vault.processed).toEqual([NOTE]);
  });

  it("refuses when the text typed since it was shown is not what was shown", async () => {
    const shown = await typedIn(`${earlier}first words\n`);
    const file = vault.note(NOTE, `${earlier}first words\nand more words\n`);
    await expect(writer.update(file, changed, TODAY, shown)).rejects.toThrow(Refusal);
    expect(vault.processed).toEqual([]);
  });

  it("refuses when text was shown that is no longer there", async () => {
    const shown: TypedText[] = [{ heading: INVENTORY, lines: ["words that are gone"] }];
    const file = vault.note(NOTE, earlier);
    await expect(writer.update(file, changed, TODAY, shown)).rejects.toThrow("not the text that was shown");
  });

  it("refuses a note that ends in a code block that is never closed, even when its text was shown", async () => {
    const current = `${earlier}\`\`\`\nx\n## Notes\n`;
    const file = vault.note(NOTE, current);
    await expect(writer.update(file, changed, TODAY, NONE)).rejects.toThrow("never closed");
    expect(vault.processed).toEqual([]);
  });

  it("writes with no text given when there is none typed", async () => {
    const file = vault.note(NOTE, earlier);
    await writer.update(file, changed, TODAY, NONE);
    expect(vault.processed).toEqual([NOTE]);
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

  it("shows the changes for a note in the Fallen folder, without writing it", async () => {
    const file = vault.note(FALLEN_NOTE, FROZEN_SNAPSHOT);
    const changes = await writer.changesFor(file, monkSheet(), TODAY);
    expect(changes.sections.length).toBe(5);
    expect(vault.processed).toEqual([]);
    expect(vault.textAt(FALLEN_NOTE)).toBe(FROZEN_SNAPSHOT);
  });

  it("refuses a note outside the Characters folder", async () => {
    const file = vault.note("D&D/Primary Campaign/Sessions/Session 1.md", "x\n");
    await expect(writer.changesFor(file, monkSheet(), TODAY)).rejects.toThrow("is not a note in the campaign's Characters or Fallen folder");
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
    await new ImportWriter(bare.gate, CHARACTERS_FOLDER, CAMPAIGN_FOLDER).create(monkSheet(), TODAY);
    expect(bare.createdFolders).toEqual([CHARACTERS_FOLDER]);
  });

  it("does not make the folder when it is there", async () => {
    await writer.create(monkSheet(), TODAY);
    expect(vault.createdFolders).toEqual([]);
  });

  it("refuses a name a note cannot have, and makes nothing", async () => {
    const odd = sheetWithCharacter(monkSheet(), { name: CleanLine.of("Primary/Monk") });
    await expect(writer.create(odd, TODAY)).rejects.toThrow("A name can't hold any of");
    expect(vault.created).toEqual([]);
  });

  it("refuses a name that a note already has, whatever its capitals, and makes nothing", async () => {
    vault.note(`${CHARACTERS_FOLDER}/primary monk.md`, "x\n");
    await expect(writer.create(monkSheet(), TODAY)).rejects.toThrow("There is already a note called primary monk");
    expect(vault.created).toEqual([]);
  });

  it("refuses a second note for a name that left play in this campaign and has a note in Fallen, and makes nothing", async () => {
    vault.note("D&D/Primary Campaign/Fallen/primary monk.md", "the fallen note\n");
    await expect(writer.create(monkSheet(), TODAY)).rejects.toThrow(leftPlayWords("Primary Monk"));
    expect(leftPlayWords("Primary Monk")).toBe(
      "Primary Monk is in this campaign's Fallen folder, so no second note was made for them. Make them main from the Fallen list to bring them back.",
    );
    expect(vault.created).toEqual([]);
  });

  it("makes the note when the note in Fallen is another campaign's", async () => {
    vault.note("D&D/Secondary Campaign/Fallen/Primary Monk.md", "the fallen note\n");
    await writer.create(monkSheet(), TODAY);
    expect(vault.created).toEqual([NOTE]);
  });

  it("makes nothing when the text it would write is not only the import", async () => {
    vi.spyOn(importedNote, "importedNoteText").mockReturnValue("Other words.\n");
    await expect(writer.create(monkSheet(), TODAY)).rejects.toThrow("outside its own properties");
    expect(vault.created).toEqual([]);
  });

  it("makes nothing when the gate refuses the folder", async () => {
    const outside = new ImportWriter(vault.gate, "Private/Characters", "Private");
    await expect(outside.create(monkSheet(), TODAY)).rejects.toThrow(OUTSIDE_FENCE);
    expect(vault.created).toEqual([]);
  });
});
