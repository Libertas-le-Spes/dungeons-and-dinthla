import { describe, expect, it } from "vitest";
import { characterSheetOf, carriedValuesOf, type SheetValue } from "../../../src/characters/reading/character-sheet";
import type { SourcedFact } from "../../../src/characters/reading/sheet-values";

const NOTE = "D&D/Primary Campaign/Characters/Primary Monk.md";
const SESSION = "D&D/Primary Campaign/Sessions/Session 1.md";

function learned(value: string): SourcedFact {
  return { name: "AC", value, source: { path: SESSION, line: 3 } };
}

function override(value: string): SourcedFact {
  return { name: "AC", value, source: { path: NOTE, line: 9 } };
}

function imported(value: string): SourcedFact {
  return { name: "AC", value, source: { path: NOTE, line: 2 } };
}

function carriedOf(value: string) {
  return carriedValuesOf({ campaign: "Other Campaign", learned: [learned(value)], imported: [], overrides: [], groups: ["values"] });
}

interface ArmourClassFacts {
  readonly learnedFacts: SourcedFact[];
  readonly importedFacts: SourcedFact[];
  readonly overrides: SourcedFact[];
  readonly carriedValue: string | null;
}

function armourClass({ learnedFacts, importedFacts, overrides, carriedValue }: ArmourClassFacts): SheetValue {
  let carried = null;
  if (carriedValue !== null) carried = carriedOf(carriedValue);
  for (const value of characterSheetOf({ learned: learnedFacts, imported: importedFacts, overrides, carried }).values) {
    if (value.name === "AC") return value;
  }
  throw new Error("The sheet has no armour class.");
}

describe("which value the sheet shows", () => {
  it("shows his own override over an imported value", () => {
    expect(armourClass({ learnedFacts: [], importedFacts: [imported("16")], overrides: [override("18")], carriedValue: null })).toMatchObject({ state: "override", shown: { value: "18" } });
  });

  it("shows an imported value over one learned at the table", () => {
    const value = armourClass({ learnedFacts: [learned("12")], importedFacts: [imported("16")], overrides: [], carriedValue: null });
    expect(value).toMatchObject({ state: "imported", shown: { value: "16", source: { path: NOTE, line: 2 } } });
    expect(value.imported).toEqual({ value: "16", source: { path: NOTE, line: 2 } });
  });

  it("shows an imported value over one carried from another campaign", () => {
    expect(armourClass({ learnedFacts: [], importedFacts: [imported("16")], overrides: [], carriedValue: "11" })).toMatchObject({ state: "imported", shown: { value: "16" } });
  });

  it("shows a learned value over a carried one when nothing is imported", () => {
    expect(armourClass({ learnedFacts: [learned("12")], importedFacts: [], overrides: [], carriedValue: "11" })).toMatchObject({ state: "learned", shown: { value: "12" }, imported: null });
  });

  it("shows a carried value when there is nothing else", () => {
    expect(armourClass({ learnedFacts: [], importedFacts: [], overrides: [], carriedValue: "11" })).toMatchObject({ state: "carried", shown: { value: "11" } });
  });

  it("says not known for an imported ?, and keeps it imported in its own place", () => {
    expect(armourClass({ learnedFacts: [learned("12")], importedFacts: [imported("?")], overrides: [], carriedValue: null })).toMatchObject({ state: "unknown", shown: { value: "?" }, imported: { value: "?" } });
  });

  it("keeps an override of ? as the override", () => {
    expect(armourClass({ learnedFacts: [], importedFacts: [imported("16")], overrides: [override("?")], carriedValue: null })).toMatchObject({ state: "override", shown: { value: "?" } });
  });

  it("lists the imported value among the earlier ones only as the import, not as a line", () => {
    expect(armourClass({ learnedFacts: [learned("12")], importedFacts: [imported("16")], overrides: [], carriedValue: null }).earlier).toEqual([{ value: "12", source: { path: SESSION, line: 3 } }]);
  });

  it("adds a row for an imported species, labelled Species", () => {
    const species: SourcedFact = { name: "species", value: "Human", source: { path: NOTE, line: 3 } };
    const rows = characterSheetOf({ learned: [], imported: [species], overrides: [], carried: null }).values;
    const labels: string[] = [];
    for (const row of rows) labels.push(row.label);
    expect(labels).toContain("Species");
  });
});

describe("the values carried to another campaign", () => {
  it("carry an imported value, and his override over it", () => {
    expect(carriedValuesOf({ campaign: "Other Campaign", learned: [learned("12")], imported: [imported("16")], overrides: [], groups: ["values"] }).values.get("AC")).toEqual({ value: "16", source: { path: NOTE, line: 2 } });
    expect(carriedValuesOf({ campaign: "Other Campaign", learned: [], imported: [imported("16")], overrides: [override("18")], groups: ["values"] }).values.get("AC")).toEqual({ value: "18", source: { path: NOTE, line: 9 } });
  });
});
