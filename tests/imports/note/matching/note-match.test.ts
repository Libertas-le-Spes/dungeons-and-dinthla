import { describe, expect, it } from "vitest";
import { notesLikeName, type NoteName } from "../../../../src/imports/note/matching/note-match";

function note(basename: string, folder = "D&D/Primary Campaign/Characters"): NoteName {
  return { path: `${folder}/${basename}.md`, basename };
}

function basenameOf(entry: NoteName): string {
  return entry.basename;
}

function basenamesOf(notes: readonly NoteName[]): string[] {
  return notes.map(basenameOf);
}

describe("notesLikeName", () => {
  it("finds a note named by the first words of the character's name", () => {
    expect(basenamesOf(notesLikeName("Primary Monk Longname", [note("Primary Monk"), note("Secondary")]))).toEqual(["Primary Monk"]);
  });

  it("finds a note named by one word of a longer name", () => {
    expect(basenamesOf(notesLikeName("Primary Monk", [note("Primary")]))).toEqual(["Primary"]);
  });

  it("finds a note whose name is longer than the character's", () => {
    expect(basenamesOf(notesLikeName("Primary", [note("Primary Monk")]))).toEqual(["Primary Monk"]);
  });

  it("puts the note with the same name first, then the nearer ones", () => {
    const notes = [note("Primary Monk Longname Junior"), note("Primary"), note("Primary Monk"), note("Primary Monk Longname")];
    expect(basenamesOf(notesLikeName("Primary Monk Longname", notes))).toEqual(["Primary Monk Longname", "Primary Monk Longname Junior", "Primary Monk", "Primary"]);
  });

  it("reads capitals, spaces and invisible characters as a name key does", () => {
    expect(basenamesOf(notesLikeName("primary MONK", [note("Primary Monk"), note("Pri​mary Monk Two")]))).toEqual(["Primary Monk", "Pri​mary Monk Two"]);
  });

  it("does not take a note that shares a first word but then differs", () => {
    expect(notesLikeName("Primary Monk", [note("Primary Rogue")])).toEqual([]);
  });

  it("does not take a note that only shares letters at the start of a word", () => {
    expect(notesLikeName("Primary Monk", [note("Prim")])).toEqual([]);
  });

  it("does not take a note whose first word differs", () => {
    expect(notesLikeName("Monk Primary", [note("Primary Monk")])).toEqual([]);
  });

  it("reads a double space in the name as a single one", () => {
    expect(basenamesOf(notesLikeName("Primary  Monk", [note("Primary Monk")]))).toEqual(["Primary Monk"]);
  });

  it("puts a note that shares more words before one that is nearer in length", () => {
    const notes = [note("Primary"), note("Primary Monk Longname Junior")];
    expect(basenamesOf(notesLikeName("Primary Monk", notes))).toEqual(["Primary Monk Longname Junior", "Primary"]);
  });

  it("finds nothing among no notes", () => {
    expect(notesLikeName("Primary", [])).toEqual([]);
  });

  it("finds nothing for a name with no words", () => {
    expect(notesLikeName("  ", [note("Primary")])).toEqual([]);
  });

  it("puts two equally near notes in the order of their paths", () => {
    const notes = [note("Primary Two", "D&D/B/Characters"), note("Primary One", "D&D/A/Characters")];
    expect(basenamesOf(notesLikeName("Primary", notes))).toEqual(["Primary One", "Primary Two"]);
  });
});
