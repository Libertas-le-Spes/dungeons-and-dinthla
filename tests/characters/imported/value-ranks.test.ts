import { describe, expect, it } from "vitest";
import { characterSheetOf, carriedValuesOf, type SheetValue } from "../../../src/characters/reading/character-sheet";
import type { ImportedFact } from "../../../src/characters/imported/imported-fact";
import type { SourcedFact } from "../../../src/characters/reading/sheet-values";

const NOTE = "D&D/Primary Campaign/Characters/Primary Monk.md";
const SESSION = "D&D/Primary Campaign/Sessions/Session 1.md";
const ROUTE = "Printed on D&D Beyond's PDF";

function learned(value: string): SourcedFact {
  return { name: "AC", value, source: { path: SESSION, line: 3 } };
}

function override(value: string): SourcedFact {
  return { name: "AC", value, source: { path: NOTE, line: 9 } };
}

function imported(value: string): ImportedFact {
  return { name: "AC", value, source: { path: NOTE, line: 2 }, route: ROUTE, working: "" };
}

function carriedOf(value: string) {
  return carriedValuesOf("Other Campaign", [learned(value)], [], [], ["values"]);
}

function armourClass(learnedFacts: SourcedFact[], importedFacts: ImportedFact[], overrides: SourcedFact[], carriedValue: string | null): SheetValue {
  let carried = null;
  if (carriedValue !== null) carried = carriedOf(carriedValue);
  for (const value of characterSheetOf(learnedFacts, importedFacts, overrides, carried).values) {
    if (value.name === "AC") return value;
  }
  throw new Error("The sheet has no armour class.");
}

describe("which value the sheet shows", () => {
  it("shows his own override over an imported value", () => {
    expect(armourClass([], [imported("16")], [override("18")], null)).toMatchObject({ state: "override", shown: { value: "18" } });
  });

  it("shows an imported value over one learned at the table", () => {
    const value = armourClass([learned("12")], [imported("16")], [], null);
    expect(value).toMatchObject({ state: "imported", shown: { value: "16", source: { path: NOTE, line: 2 } } });
    expect(value.imported).toEqual({ value: "16", source: { path: NOTE, line: 2 }, route: ROUTE, working: "" });
  });

  it("shows an imported value over one carried from another campaign", () => {
    expect(armourClass([], [imported("16")], [], "11")).toMatchObject({ state: "imported", shown: { value: "16" } });
  });

  it("shows a learned value over a carried one when nothing is imported", () => {
    expect(armourClass([learned("12")], [], [], "11")).toMatchObject({ state: "learned", shown: { value: "12" }, imported: null });
  });

  it("shows a carried value when there is nothing else", () => {
    expect(armourClass([], [], [], "11")).toMatchObject({ state: "carried", shown: { value: "11" } });
  });

  it("says not known for an imported ?, and keeps it imported in its own place", () => {
    expect(armourClass([learned("12")], [imported("?")], [], null)).toMatchObject({ state: "unknown", shown: { value: "?" } });
  });

  it("keeps an override of ? as the override", () => {
    expect(armourClass([], [imported("16")], [override("?")], null)).toMatchObject({ state: "override", shown: { value: "?" } });
  });

  it("lists the imported value among the earlier ones only as the import, not as a line", () => {
    expect(armourClass([learned("12")], [imported("16")], [], null).earlier).toEqual([{ value: "12", source: { path: SESSION, line: 3 } }]);
  });

  it("adds a row for an imported species, labelled Species", () => {
    const species: ImportedFact = { name: "species", value: "Human", source: { path: NOTE, line: 3 }, route: ROUTE, working: "" };
    const rows = characterSheetOf([], [species], [], null).values;
    const labels: string[] = [];
    for (const row of rows) labels.push(row.label);
    expect(labels).toContain("Species");
  });
});

describe("the values carried to another campaign", () => {
  it("carry an imported value, and his override over it", () => {
    expect(carriedValuesOf("Other Campaign", [learned("12")], [imported("16")], [], ["values"]).values.get("AC")).toEqual({ value: "16", source: { path: NOTE, line: 2 } });
    expect(carriedValuesOf("Other Campaign", [], [imported("16")], [override("18")], ["values"]).values.get("AC")).toEqual({ value: "18", source: { path: NOTE, line: 9 } });
  });
});
