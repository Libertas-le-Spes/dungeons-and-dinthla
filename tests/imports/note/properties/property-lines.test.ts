import { describe, expect, it } from "vitest";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { Refusal } from "../../../../src/beyond/shape/refusal";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { PRINTED } from "../../../../src/beyond/sheet/printed-route";
import { classLabelOf } from "../../../../src/imports/note/properties/helpers/class-label";
import { importMarkLinesOf } from "../../../../src/imports/note/properties/helpers/import-mark-lines";
import { quotedYamlOf } from "../../../../src/imports/note/properties/helpers/quoted-yaml";
import { ClassProperty } from "../../../../src/imports/note/properties/kinds/class-property";
import { NumberProperty } from "../../../../src/imports/note/properties/kinds/number-property";
import { ScoreProperty } from "../../../../src/imports/note/properties/kinds/score-property";
import { SpeciesProperty } from "../../../../src/imports/note/properties/kinds/species-property";
import { propertyLinesOf } from "../../../../src/imports/note/properties/property-lines-of";
import { SCORE_ROWS } from "../../../../src/imports/note/rows/score-rows";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { firstLines, linesStartingWith, textOf } from "../../builders/line-helpers";
import { monkSheet, notKnownNumber, sheetOf, sheetWithCharacter, stampedOn, TODAY } from "../../builders/made-up-import";

function known(value: number): KnownValue {
  return KnownValue.wholeNumber(value, "", PRINTED);
}

function classOf(name: string, level: KnownValue | ReturnType<typeof notKnownNumber>) {
  return { name: CleanLine.of(name), level };
}

function lineOfScore(row: (typeof SCORE_ROWS)[number]): string | null {
  return new ScoreProperty(row).lineOf(monkSheet().character);
}

function scoreRowAt(position: number): (typeof SCORE_ROWS)[number] {
  for (const [at, row] of SCORE_ROWS.entries()) {
    if (at === position) return row;
  }
  throw new Error("No such score row.");
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
    const character = sheetWithCharacter(monkSheet(), { classes: [classOf('[[Secret]] "x"', known(1))] }).character;
    expect(new ClassProperty().lineOf(character)).toBe('class: "\\\\[\\\\[Secret\\\\]\\\\] \\"x\\" 1"');
  });

  it("writes nothing when the character has no class", () => {
    expect(new ClassProperty().lineOf(sheetWithCharacter(monkSheet(), { classes: [] }).character)).toBeNull();
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

  it("is never given a blank species, since a line of text cannot be blank", () => {
    expect(() => CleanLine.of("   ")).toThrow(Refusal);
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
  it.each([
    [0, "STR: 11"],
    [1, "DEX: 12"],
    [2, "CON: 13"],
    [3, "INT: 14"],
    [4, "WIS: 15"],
    [5, "CHA: 16"],
  ])("writes score row %i as %s", (position, line) => {
    expect(lineOfScore(scoreRowAt(position))).toBe(line);
  });

  it("writes nothing for a score that is not known", () => {
    const unknown = sheetOf(MadeUpSheet.monk().with("WIS", "")).character;
    expect(new ScoreProperty(scoreRowAt(4)).lineOf(unknown)).toBeNull();
  });
});

describe("importMarkLinesOf", () => {
  const route = monkSheet().character.route;

  it.each(["x2026-11-13", "2026-11-13x", "2026-11-133", "226-11-13", "2026-11-1"])("refuses the date %j", (date) => {
    expect(() => importMarkLinesOf({ route, stamp: stampedOn(date) })).toThrow(Refusal);
  });

  it.each(["PDF", "a b", "", "abcdefghijklmnopq", "pdf\n", "pdf1", "x:y"])("refuses the route name %j", (name) => {
    expect(() => importMarkLinesOf({ route: { name, source: "" }, stamp: stampedOn(TODAY) })).toThrow(Refusal);
  });

  it.each(["p", "pdf", "abcdefghijklmnop"])("writes the route name %j", (name) => {
    expect(importMarkLinesOf({ route: { name, source: "" }, stamp: { today: TODAY, session: 3 } })).toEqual(["imported: 2026-11-13", `imported-from: ${name}`, "imported-session: 3"]);
  });
});

describe("propertyLinesOf", () => {
  it("puts the three marks first and then each known value, in the order the layout lists them", () => {
    expect(firstLines(propertyLinesOf({ character: monkSheet().character, stamp: stampedOn(TODAY) }), 7)).toEqual([
      "imported: 2026-11-13",
      "imported-from: pdf",
      "imported-session: 0",
      'class: "Monk 4"',
      'species: "Human"',
      "AC: 18",
      "HP: 51",
    ]);
  });

  it("writes exactly the marks and the known values when two are not known", () => {
    const lines = propertyLinesOf({ character: sheetOf(MadeUpSheet.monk().with("AC", "").with("Speed", "")).character, stamp: stampedOn(TODAY) });
    expect(lines).toEqual([
      "imported: 2026-11-13",
      "imported-from: pdf",
      "imported-session: 0",
      'class: "Monk 4"',
      'species: "Human"',
      "HP: 51",
      "STR: 11",
      "DEX: 12",
      "CON: 13",
      "INT: 14",
      "WIS: 15",
      "CHA: 16",
    ]);
  });

  it("leaves out a value that is not known, and keeps the rest", () => {
    const text = textOf(...propertyLinesOf({ character: sheetOf(MadeUpSheet.monk().with("AC", "").with("Speed", "")).character, stamp: stampedOn(TODAY) }));
    expect([linesStartingWith(text, "AC"), linesStartingWith(text, "speed"), linesStartingWith(text, "HP")]).toEqual([[], [], ["HP: 51"]]);
  });
});
