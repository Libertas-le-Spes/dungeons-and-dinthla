import { describe, expect, it } from "vitest";
import { carriedValuesOf, characterSheetOf, labelOf, type CharacterSheet, type SheetValue } from "../../../src/characters/reading/character-sheet";
import type { SourcedFact } from "../../../src/characters/reading/sheet-values";

const MIRA = "Pale Moon/Characters/Mira.md";

function inSession(number: number, line: number, name: string, value: string): SourcedFact {
  return { name, value, source: { path: `Pale Moon/Sessions/Session ${number}.md`, line } };
}

function onNote(line: number, name: string, value: string, path = MIRA): SourcedFact {
  return { name, value, source: { path, line } };
}

function valueNamed(sheet: CharacterSheet, name: string): SheetValue {
  return [...sheet.abilities, ...sheet.values].find((value) => value.name === name)!;
}

describe("characterSheetOf", () => {
  it("lists the six abilities, then the sheet's other values in order", () => {
    const sheet = characterSheetOf({ learned: [], imported: [], overrides: [], carried: null });
    expect(sheet.abilities.map(({ name }) => name)).toEqual(["STR", "DEX", "CON", "INT", "WIS", "CHA"]);
    expect(sheet.values.map(({ label }) => label)).toEqual(["Type line", "Subtitle", "Class", "Armor Class", "Hit Points", "Speed", "Alignment"]);
  });

  it("marks a value no line states as not known, with nothing shown", () => {
    const value = valueNamed(characterSheetOf({ learned: [], imported: [], overrides: [], carried: null }), "AC");
    expect(value).toMatchObject({ state: "unknown", shown: null, override: null, learned: null, carried: null, earlier: [] });
  });

  it("shows the newest learned value with its session, and the older lines as earlier values", () => {
    const learned = [inSession(1, 3, "AC", "14"), inSession(2, 0, "ac", "15")];
    const value = valueNamed(characterSheetOf({ learned, imported: [], overrides: [], carried: null }), "AC");
    expect(value.state).toBe("learned");
    expect(value.shown).toEqual({ value: "15", source: learned[1]!.source });
    expect(value.earlier).toEqual([{ value: "14", source: learned[0]!.source }]);
  });

  it("lets an override win over what was learned, keeping the learned lines as earlier values", () => {
    const learned = [inSession(1, 3, "WIS", "16")];
    const value = valueNamed(characterSheetOf({ learned, imported: [], overrides: [onNote(0, "WIS", "18")], carried: null }), "WIS");
    expect(value.state).toBe("override");
    expect(value.shown).toEqual({ value: "18", source: { path: MIRA, line: 0 } });
    expect(value.learned).toEqual({ value: "16", source: learned[0]!.source });
    expect(value.earlier.map(({ value: earlier }) => earlier)).toEqual(["16"]);
  });

  it("reads a learned ? as not known, keeping where it was written and what came before", () => {
    const learned = [inSession(1, 0, "HP", "38"), inSession(2, 4, "HP", "?")];
    const value = valueNamed(characterSheetOf({ learned, imported: [], overrides: [], carried: null }), "HP");
    expect(value.state).toBe("unknown");
    expect(value.shown).toEqual({ value: "?", source: learned[1]!.source });
    expect(value.earlier.map(({ value: earlier }) => earlier)).toEqual(["38"]);
  });

  it("shows a value learned after it was marked not known", () => {
    const learned = [inSession(1, 0, "AC", "15"), inSession(2, 0, "AC", "?"), inSession(9, 0, "AC", "18")];
    const value = valueNamed(characterSheetOf({ learned, imported: [], overrides: [], carried: null }), "AC");
    expect(value.state).toBe("learned");
    expect(value.shown!.value).toBe("18");
  });

  it("reads an override of ? like any other override", () => {
    const value = valueNamed(characterSheetOf({ learned: [inSession(1, 0, "HP", "38")], imported: [], overrides: [onNote(2, "HP", "?")], carried: null }), "HP");
    expect(value.state).toBe("override");
    expect(value.shown).toEqual({ value: "?", source: { path: MIRA, line: 2 } });
  });

  it("shows a carried value with its campaign when nothing in this campaign states it", () => {
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [], imported: [], overrides: [onNote(1, "class", "Cleric", "Ashen Road/Characters/Mira.md")], groups: ["values"] });
    const value = valueNamed(characterSheetOf({ learned: [], imported: [], overrides: [], carried }), "class");
    expect(value.state).toBe("carried");
    expect(value.carriedCampaign).toBe("Ashen Road");
    expect(value.shown).toEqual({ value: "Cleric", source: { path: "Ashen Road/Characters/Mira.md", line: 1 } });
  });

  it("lets anything learned in this campaign win over a carried value", () => {
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [], imported: [], overrides: [onNote(1, "class", "Cleric", "Ashen Road/Characters/Mira.md")], groups: ["values"] });
    const value = valueNamed(characterSheetOf({ learned: [inSession(1, 0, "Class", "Priest")], imported: [], overrides: [], carried }), "class");
    expect(value.state).toBe("learned");
    expect(value.shown!.value).toBe("Priest");
    expect(value.carried!.value).toBe("Cleric");
  });

  it("adds the other names after the sheet's own, once whatever their capitals, in the order first written", () => {
    const learned = [
      inSession(1, 0, "languages", "Common"),
      inSession(1, 1, "Patron", "Lady Vess"),
      inSession(1, 2, "ac", "15"),
      inSession(2, 0, "Languages", "Elvish"),
    ];
    const sheet = characterSheetOf({ learned, imported: [], overrides: [], carried: null });
    expect(sheet.values.slice(7).map(({ name }) => name)).toEqual(["languages", "Patron"]);
    expect(valueNamed(sheet, "languages").shown!.value).toBe("Elvish");
  });

  it("adds other names that only a carried note states", () => {
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [], imported: [], overrides: [onNote(1, "Deity", "Lathander", "Ashen Road/Characters/Mira.md")], groups: ["values"] });
    expect(characterSheetOf({ learned: [], imported: [], overrides: [], carried }).values.slice(7).map(({ name }) => name)).toEqual(["Deity"]);
  });
});

describe("carriedValuesOf", () => {
  const OTHER = "Ashen Road/Characters/Mira.md";

  it("keeps only the groups listed, the newest line winning", () => {
    const learned = [inSession(1, 0, "INT", "10"), inSession(1, 1, "AC", "12"), inSession(2, 0, "int", "11")];
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned, imported: [], overrides: [], groups: ["abilities"] });
    expect([...carried.values]).toEqual([["INT", { value: "11", source: learned[2]!.source }]]);
  });

  it("carries a name once whatever its capitals, the newest line winning", () => {
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [inSession(1, 0, "Deity", "Lathander"), inSession(2, 0, "deity", "Selune")], imported: [], overrides: [], groups: ["values"] });
    expect([...carried.values].map(([name, { value }]) => [name, value])).toEqual([["deity", "Selune"]]);
  });

  it("lets the carried note's own overrides win over what it learned", () => {
    const carried = carriedValuesOf({ campaign: "Ashen Road", learned: [inSession(1, 0, "AC", "12")], imported: [], overrides: [onNote(0, "AC", "13", OTHER)], groups: ["values"] });
    expect(carried.values.get("AC")!.value).toBe("13");
  });

  it("carries nothing when no group is listed", () => {
    expect(carriedValuesOf({ campaign: "Ashen Road", learned: [inSession(1, 0, "AC", "12")], imported: [], overrides: [], groups: [] }).values.size).toBe(0);
  });
});

describe("labelOf", () => {
  it("names the sheet's values in full and leaves other names as written", () => {
    expect(labelOf("AC")).toBe("Armor Class");
    expect(labelOf("Patron")).toBe("Patron");
  });

  it("leaves a value named like a member every object has as written", () => {
    expect(labelOf("constructor")).toBe("constructor");
  });
});
