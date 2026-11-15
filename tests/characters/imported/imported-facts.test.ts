import { describe, expect, it } from "vitest";
import { importedFactsOf } from "../../../src/characters/imported/reading/imported-facts";
import type { SourcedFact } from "../../../src/characters/facts/sourced-fact";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { monkSheet, sheetWithCharacter, TODAY , stampedOn } from "../../imports/builders/made-up-import";
import { CleanLine } from "../../../src/beyond/text/clean-line";
import { textOf } from "../../imports/builders/line-helpers";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";

function factNamed(facts: readonly SourcedFact[], name: string): SourcedFact {
  for (const fact of facts) {
    if (fact.name === name) return fact;
  }
  throw new Error(`No imported fact is called ${name}.`);
}

function namesOf(facts: readonly SourcedFact[]): string[] {
  const names: string[] = [];
  for (const fact of facts) names.push(fact.name);
  return names;
}

describe("the values an import wrote into a note", () => {
  it("are read from the properties of a note the import wrote", () => {
    const facts = importedFactsOf(importedNoteText({ current: "", sheet: monkSheet(), stamp: stampedOn(TODAY) }), PATH);
    expect(namesOf(facts)).toContain("AC");
    expect(namesOf(facts)).toContain("STR");
    expect(factNamed(facts, "class")).toMatchObject({ value: "Monk 4" });
    expect(factNamed(facts, "species")).toMatchObject({ value: "Human" });
  });

  it("are none when the note has no imported-from property", () => {
    expect(importedFactsOf(textOf("---", "AC: 15", "STR: 12", "---", "Notes."), PATH)).toEqual([]);
  });

  it("name the line each comes from", () => {
    const facts = importedFactsOf(textOf("---", "imported-from: pdf", "AC: 15", "---", ""), PATH);
    expect(factNamed(facts, "AC").source).toEqual({ path: PATH, line: 2 });
  });

  it("take only the import's exact property names, quoted or not", () => {
    const facts = importedFactsOf(textOf("---", "imported-from: pdf", '"AC": 15', "ac: 9", "Speed: 40", "notes: kept", "---", ""), PATH);
    expect(namesOf(facts)).toEqual(["AC"]);
  });

  it("take the quotes and the escapes off a text value, giving back what the import was given", () => {
    const species = 'Sword_dancer [one] "Two" \\ back';
    const sheet = sheetWithCharacter(monkSheet(), { species: CleanLine.of(species) });
    const written = importedNoteText({ current: "", sheet: sheet, stamp: stampedOn(TODAY) });
    expect(written).not.toContain(`species: "${species}"`);
    expect(factNamed(importedFactsOf(written, PATH), "species").value).toBe(species);
  });

  it("leave out a property with no value", () => {
    expect(importedFactsOf(textOf("---", "imported-from: pdf", "AC:", "---", ""), PATH)).toEqual([]);
  });

  it("are read from a note whatever route the import took", () => {
    expect(namesOf(importedFactsOf(textOf("---", "imported-from: online", "AC: 15", "---", ""), PATH))).toEqual(["AC"]);
    expect(namesOf(importedFactsOf(textOf("---", "imported-from: elsewhere", "AC: 15", "---", ""), PATH))).toEqual(["AC"]);
  });
});
