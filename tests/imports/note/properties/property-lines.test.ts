import { describe, expect, it } from "vitest";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { importMarkLinesOf } from "../../../../src/imports/note/properties/import-mark-lines";
import { classLabelOf } from "../../../../src/imports/note/properties/class-label";
import { ClassProperty } from "../../../../src/imports/note/properties/class-property";
import { NumberProperty } from "../../../../src/imports/note/properties/number-property";
import { propertyLinesOf } from "../../../../src/imports/note/properties/property-lines-of";
import { quotedYamlOf } from "../../../../src/imports/note/properties/quoted-yaml";
import { ScoreProperty } from "../../../../src/imports/note/properties/score-property";
import { SCORE_ROWS } from "../../../../src/imports/note/properties/score-rows";
import { SpeciesProperty } from "../../../../src/imports/note/properties/species-property";
import { PRINTED } from "../../../../src/beyond/sheet/printed-route";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { monkSheet, notKnownNumber, sheetOf, sheetWithCharacter, TODAY } from "../../builders/made-up-import";

function known(value: number): KnownValue {
  return KnownValue.wholeNumber(value, "", PRINTED);
}

function classOf(name: string, level: KnownValue | ReturnType<typeof notKnownNumber>) {
  return { name: CleanLine.of(name), level };
}

describe("quotedYamlOf", () => {
  it("wraps text in double quotes", () => {
    expect(quotedYamlOf("Human")).toBe('"Human"');
  });

  it("puts a backslash before a double quote", () => {
    expect(quotedYamlOf('say "hi"')).toBe('"say \\"hi\\""');
  });

  it("doubles a backslash", () => {
    expect(quotedYamlOf("a\\b")).toBe('"a\\\\b"');
  });
});

describe("classLabelOf", () => {
  it("joins a class and its level", () => {
    expect(classLabelOf(classOf("Monk", known(4)))).toBe("Monk 4");
  });

  it("leaves the level out when it is not known", () => {
    expect(classLabelOf(classOf("Monk", notKnownNumber()))).toBe("Monk");
  });
});

describe("ClassProperty", () => {
  it("lists each class with its level between slashes, in quotes", () => {
    const character = sheetWithCharacter(monkSheet(), { classes: [classOf("Monk", known(4)), classOf("Rogue", known(2))] }).character;
    expect(new ClassProperty().lineOf(character)).toBe('class: "Monk 4 / Rogue 2"');
  });

  it("makes a link in a class name inert and keeps the quoted text on one line", () => {
    const character = sheetWithCharacter(monkSheet(), { classes: [classOf("[[Secret]] \"x\"", known(1))] }).character;
    expect(new ClassProperty().lineOf(character)).toBe('class: "\\\\[\\\\[Secret\\\\]\\\\] \\"x\\" 1"');
  });
});

describe("SpeciesProperty", () => {
  it("writes the species in quotes", () => {
    expect(new SpeciesProperty().lineOf(monkSheet().character)).toBe('species: "Human"');
  });

  it("makes markup in the species inert", () => {
    const character = sheetWithCharacter(monkSheet(), { species: CleanLine.of("`= this`") }).character;
    expect(new SpeciesProperty().lineOf(character)).toBe('species: "\\\\`= this\\\\`"');
  });
});

describe("NumberProperty", () => {
  const character = monkSheet().character;

  it("writes a known number under the property's own name", () => {
    expect(new NumberProperty("AC", "AC").lineOf(character)).toBe("AC: 18");
  });

  it("looks the number up by the number's name, not the property's", () => {
    expect(new NumberProperty("speed", "Speed").lineOf(character)).toBe("speed: 35");
  });

  it("writes nothing for a number that is not known", () => {
    const unknown = sheetOf(MadeUpSheet.monk().with("AC", "")).character;
    expect(new NumberProperty("AC", "AC").lineOf(unknown)).toBeNull();
  });

  it("writes nothing for a number the character does not have", () => {
    expect(new NumberProperty("AC", "No such number").lineOf(character)).toBeNull();
  });
});

describe("ScoreProperty", () => {
  it("writes each of the six scores under its short name", () => {
    const lines = SCORE_ROWS.map((row) => new ScoreProperty(row).lineOf(monkSheet().character));
    expect(lines).toEqual(["STR: 11", "DEX: 12", "CON: 13", "INT: 14", "WIS: 15", "CHA: 16"]);
  });

  it("writes nothing for a score that is not known", () => {
    const unknown = sheetOf(MadeUpSheet.monk().with("WIS", "")).character;
    expect(new ScoreProperty(SCORE_ROWS[4]!).lineOf(unknown)).toBeNull();
  });
});

describe("propertyLinesOf", () => {
  it("puts the two marks first and then each known value, in the order the layout lists them", () => {
    expect(propertyLinesOf(monkSheet().character, TODAY).slice(0, 6)).toEqual([
      "imported: 2026-11-13",
      "imported-from: pdf",
      'class: "Monk 4"',
      'species: "Human"',
      "AC: 18",
      "HP: 51",
    ]);
  });

  it("leaves out a value that is not known, and keeps the rest", () => {
    const lines = propertyLinesOf(sheetOf(MadeUpSheet.monk().with("AC", "").with("Speed", "")).character, TODAY);
    expect(lines.filter((line) => line.startsWith("AC") || line.startsWith("speed"))).toEqual([]);
    expect(lines).toContain("HP: 51");
  });
});

describe("importMarkLinesOf", () => {
  const route = monkSheet().character.route;

  it.each(["x2026-11-13", "2026-11-13x", "2026-11-133", "226-11-13", "2026-11-1"])("refuses the date %j", (date) => {
    expect(() => importMarkLinesOf(route, date)).toThrow(Refusal);
  });

  it.each(["PDF", "a b", "", "abcdefghijklmnopq", "pdf\n", "pdf1", "x:y"])("refuses the route name %j", (name) => {
    expect(() => importMarkLinesOf({ name, source: "" }, TODAY)).toThrow(Refusal);
  });

  it.each(["p", "pdf", "abcdefghijklmnop"])("writes the route name %j", (name) => {
    expect(importMarkLinesOf({ name, source: "" }, TODAY)).toEqual(["imported: 2026-11-13", `imported-from: ${name}`]);
  });
});
