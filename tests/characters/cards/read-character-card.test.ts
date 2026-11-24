import { describe, expect, it } from "vitest";
import { readCharacterCard } from "../../../src/characters/cards/read-character-card";
import { withOverrides } from "../../../src/characters/editing/character-entry";
import { importedFactsOf } from "../../../src/characters/imported/reading/imported-facts";
import type { CharacterNotes } from "../../../src/characters/reading/character-notes";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { STUB_SYNTAX } from "../../host/stub-syntax";
import { monkSheet, stampedOn, TODAY } from "../../imports/builders/made-up-import";
import { fileAt } from "../../stubs/note-files";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";
const IMPORTED = importedNoteText({ current: "", sheet: monkSheet(), stamp: stampedOn(TODAY) }, STUB_SYNTAX);

function notesHolding(text: string): CharacterNotes {
  return { textOf: async () => text, isOwnCharacter: () => false } as unknown as CharacterNotes;
}

function importedValueOf(name: string): string {
  const fact = importedFactsOf(IMPORTED, PATH, STUB_SYNTAX).find((candidate) => candidate.name === name);
  if (fact === undefined) throw new Error(`The import wrote no ${name}.`);
  return fact.value;
}

describe("readCharacterCard", () => {
  it("shows the values an import wrote into the character's note", async () => {
    const card = await readCharacterCard(fileAt(PATH), new Map(), notesHolding(IMPORTED), STUB_SYNTAX);
    expect(card.values.get("AC")).toBe(importedValueOf("AC"));
    expect(card.values.get("STR")).toBe(importedValueOf("STR"));
  });

  it("lets a value written in the note's own lines win over the imported one", async () => {
    const overridden = withOverrides(IMPORTED, PATH, [{ name: "AC", label: "Armor Class", before: "", after: "99" }], STUB_SYNTAX);
    const card = await readCharacterCard(fileAt(PATH), new Map(), notesHolding(overridden), STUB_SYNTAX);
    expect(importedValueOf("AC")).not.toBe("99");
    expect(card.values.get("AC")).toBe("99");
  });
});
