import { describe, expect, it } from "vitest";
import { importedFactsOf } from "../../../src/characters/imported/reading/imported-facts";
import type { ImportedFact } from "../../../src/characters/imported/reading/imported-fact";
import { importedNoteText } from "../../../src/imports/note/writing/rewriting/imported-note";
import { monkSheet, sheetWithCharacter, TODAY , stampedOn } from "../../imports/builders/made-up-import";
import { CleanLine } from "../../../src/beyond/text/clean-line";
import { textOf } from "../../imports/builders/line-helpers";

const PATH = "D&D/Primary Campaign/Characters/Primary Monk.md";
const PRINTED = "Printed on D&D Beyond's PDF";

function factNamed(facts: readonly ImportedFact[], name: string): ImportedFact {
  for (const fact of facts) {
    if (fact.name === name) return fact;
  }
  throw new Error(`No imported fact is called ${name}.`);
}

function namesOf(facts: readonly ImportedFact[]): string[] {
  const names: string[] = [];
  for (const fact of facts) names.push(fact.name);
  return names;
}

describe("the values an import wrote into a note", () => {
  it("are read from the properties of a note the import wrote, with the PDF's route", () => {
    const facts = importedFactsOf(importedNoteText({ current: "", sheet: monkSheet(), stamp: stampedOn(TODAY) }), PATH);
    expect(namesOf(facts)).toContain("AC");
    expect(namesOf(facts)).toContain("STR");
    expect(factNamed(facts, "class")).toMatchObject({ value: "Monk 4", route: PRINTED });
    expect(factNamed(facts, "species")).toMatchObject({ value: "Human", route: PRINTED });
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

  it("say the online route for an online import, and a plain route for one they don't know", () => {
    expect(factNamed(importedFactsOf(textOf("---", "imported-from: online", "AC: 15", "---", ""), PATH), "AC").route).toBe("Worked out here, from D&D Beyond (online)");
    expect(factNamed(importedFactsOf(textOf("---", "imported-from: elsewhere", "AC: 15", "---", ""), PATH), "AC").route).toBe("From D&D Beyond");
  });

  it("carry the working from the Numbers section, by name and whatever the capitals", () => {
    const text = textOf("---", "imported-from: online", "AC: 16", "speed: 40", "---", "## Numbers (from D&D Beyond)", "- AC · 16 · 10 + DEX 4 + WIS 2 · Worked out here", "- Speed · 40 · Worked out here", "");
    const facts = importedFactsOf(text, PATH);
    expect(factNamed(facts, "AC").working).toBe("10 + DEX 4 + WIS 2");
    expect(factNamed(facts, "speed").working).toBe("");
  });

  it("read the working only inside the Numbers section", () => {
    const text = textOf("---", "imported-from: online", "AC: 16", "---", "## Notes", "- AC · 16 · Typed by hand · Worked out here", "");
    expect(factNamed(importedFactsOf(text, PATH), "AC").working).toBe("");
  });

  it("take the escapes off the working", () => {
    const text = textOf("---", "imported-from: online", "AC: 16", "---", "## Numbers (from D&D Beyond)", "- AC · 16 · Ring of \\*luck\\* · Worked out here", "");
    expect(factNamed(importedFactsOf(text, PATH), "AC").working).toBe("Ring of *luck*");
  });
});

describe("the working of an imported value", () => {
  it("is read only from under the Numbers heading, not from his own bullet just above it", () => {
    const text = textOf("---", "imported-from: pdf", "AC: 16", "---", "- AC · 99 · a working of his · Typed", "## Numbers (from D&D Beyond)", "- AC · 16 · 10 + DEX 4 + WIS 2 · Printed", "");
    expect(factNamed(importedFactsOf(text, PATH), "AC").working).toBe("10 + DEX 4 + WIS 2");
  });
});
