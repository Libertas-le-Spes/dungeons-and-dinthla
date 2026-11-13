import { describe, expect, it } from "vitest";
import { overrideValueOf, stillReads, withEntryValues, withOverrides } from "../../../src/characters/editing/character-entry";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { monkSheet, TODAY } from "../../imports/builders/made-up-import";
import { textOf } from "../../imports/builders/line-helpers";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";
const NUMBERS = "## Numbers (from D&D Beyond)";

function lineIndexOf(text: string, line: string): number {
  return text.split("\n").indexOf(line);
}

function noteWithHisWords(): string {
  return importedNoteText(textOf("His own words.", ""), monkSheet(), TODAY);
}

describe("an override on a note the import wrote", () => {
  it("is written after his own words and before the import's first section, and reads back", () => {
    const written = withOverrides(noteWithHisWords(), PATH, [{ name: "AC", label: "Armor Class", before: "", after: "19" }]);
    expect(lineIndexOf(written, "AC: 19")).toBe(lineIndexOf(written, "His own words.") + 1);
    expect(lineIndexOf(written, "AC: 19")).toBeLessThan(lineIndexOf(written, NUMBERS));
    expect(overrideValueOf(written, PATH, "AC")).toBe("19");
  });

  it("keeps a blank line between his words and the import's sections where one was", () => {
    const current = importedNoteText(textOf("His own words.", "", ""), monkSheet(), TODAY);
    const written = withOverrides(current, PATH, [{ name: "HP", label: "Hit Points", before: "", after: "60" }]);
    expect(lineIndexOf(written, "HP: 60")).toBe(lineIndexOf(written, "His own words.") + 1);
  });

  it("is written straight after the properties when he has no words of his own", () => {
    const current = importedNoteText("", monkSheet(), TODAY);
    const written = withOverrides(current, PATH, [{ name: "AC", label: "Armor Class", before: "", after: "19" }]);
    expect(written.split("\n")).toContain("AC: 19");
    expect(lineIndexOf(written, "AC: 19")).toBeLessThan(lineIndexOf(written, NUMBERS));
    expect(overrideValueOf(written, PATH, "AC")).toBe("19");
  });

  it("changes nothing else in the note", () => {
    const current = noteWithHisWords();
    const written = withOverrides(current, PATH, [{ name: "AC", label: "Armor Class", before: "", after: "19" }]);
    expect(written.replace("AC: 19\n", "")).toBe(current);
  });

  it("keeps the note's own line breaks when it uses carriage returns", () => {
    const current = noteWithHisWords().split("\n").join("\r\n");
    const written = withOverrides(current, PATH, [{ name: "AC", label: "Armor Class", before: "", after: "19" }]);
    expect(written.replace("AC: 19\r\n", "")).toBe(current);
  });
});

describe("Edit character on a note the import wrote", () => {
  it("writes the speed it was given where it reads back", () => {
    const entry = { name: "Primary Monk", type: "", subtitle: "", speed: "" };
    const written = withEntryValues(noteWithHisWords(), PATH, entry, { ...entry, speed: "40 ft." });
    expect(overrideValueOf(written, PATH, "speed")).toBe("40 ft.");
    expect(lineIndexOf(written, "speed: 40 ft.")).toBeLessThan(lineIndexOf(written, NUMBERS));
  });
});

describe("the words when a change wouldn't read back", () => {
  it("say the value wouldn't be given at all when nothing reads back", () => {
    expect(stillReads("Armor Class", "")).toBe("After that change the note wouldn't give the armor class at all, so nothing was written. Change it in the note.");
  });

  it("name the value that would still be read when one does", () => {
    expect(stillReads("Armor Class", "15")).toBe(
      "After that change the note would still give the armor class as 15, from a line the dialog can't change, so nothing was written. Change it in the note.",
    );
  });
});
