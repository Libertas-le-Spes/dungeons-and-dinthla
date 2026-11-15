import { describe, expect, it } from "vitest";
import type { ImportedCharacter } from "../../../../src/beyond/shape/imported-character";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { PRINTED } from "../../../../src/beyond/sheet/printed-route";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { subtitleOf } from "../../../../src/imports/note/properties/helpers/subtitle-line";
import { typeLineOf } from "../../../../src/imports/note/properties/helpers/type-line";
import { SubtitleProperty } from "../../../../src/imports/note/properties/kinds/subtitle-property";
import { TypeProperty } from "../../../../src/imports/note/properties/kinds/type-property";
import { monkSheet, sheetWithCharacter } from "../../builders/made-up-import";

function line(text: string | null): CleanLine | null {
  if (text === null) return null;
  return CleanLine.of(text);
}

interface Details {
  size: string | null;
  creatureType: string | null;
  alignment: string | null;
  species?: string;
}

function characterWith({ size, creatureType, alignment, species }: Details): ImportedCharacter {
  const base = { size: line(size), creatureType: line(creatureType), alignment: line(alignment) };
  if (species === undefined) return sheetWithCharacter(monkSheet(), base).character;
  return sheetWithCharacter(monkSheet(), { ...base, species: CleanLine.of(species) }).character;
}

function level(name: string, value: number) {
  return { name: CleanLine.of(name), level: KnownValue.wholeNumber(value, "", PRINTED) };
}

describe("typeLineOf", () => {
  it("is the size, creature type, species and alignment", () => {
    expect(typeLineOf(characterWith({ size: "Medium", creatureType: "Humanoid", alignment: "Lawful good" }))).toBe("Medium humanoid (human), lawful good");
  });

  it("writes the species in lower case, whatever the capitals it came in", () => {
    expect(typeLineOf(characterWith({ size: "Small", creatureType: "Humanoid", alignment: "Neutral", species: "Half-Elf" }))).toBe("Small humanoid (half-elf), neutral");
  });

  it("leaves out the size when it is not known", () => {
    expect(typeLineOf(characterWith({ size: null, creatureType: "Humanoid", alignment: "Neutral" }))).toBe("Humanoid (human), neutral");
  });

  it("leaves out the creature type when it is not known", () => {
    expect(typeLineOf(characterWith({ size: "Medium", creatureType: null, alignment: "Neutral" }))).toBe("Medium (human), neutral");
  });

  it("leaves out the alignment when it is not known", () => {
    expect(typeLineOf(characterWith({ size: "Medium", creatureType: "Humanoid", alignment: null }))).toBe("Medium humanoid (human)");
  });

  it("is the species alone when nothing else is known, never blank", () => {
    expect(typeLineOf(characterWith({ size: null, creatureType: null, alignment: null }))).toBe("Human");
  });

  it("keeps the species and the alignment when the size and type are not known", () => {
    expect(typeLineOf(characterWith({ size: null, creatureType: null, alignment: "Chaotic neutral" }))).toBe("Human, chaotic neutral");
  });
});

describe("subtitleOf", () => {
  it("is the species, the class and its level", () => {
    expect(subtitleOf(sheetWithCharacter(monkSheet(), { classes: [level("Cleric", 5)] }).character)).toBe("Human Cleric 5");
  });

  it("lists each class of a multiclass character, with its level", () => {
    const classes = [level("Warlock", 2), level("Ranger", 1)];
    expect(subtitleOf(sheetWithCharacter(monkSheet(), { classes }).character)).toBe("Human Warlock 2 / Ranger 1");
  });

  it("is the species alone when there is no class", () => {
    expect(subtitleOf(sheetWithCharacter(monkSheet(), { classes: [] }).character)).toBe("Human");
  });
});

describe("TypeProperty and SubtitleProperty", () => {
  it("write the lines as quoted values, in the properties", () => {
    const character = characterWith({ size: "Medium", creatureType: "Humanoid", alignment: "Lawful good" });
    expect(new TypeProperty().lineOf(character)).toBe('type: "Medium humanoid (human), lawful good"');
    expect(new SubtitleProperty().lineOf(character)).toBe('subtitle: "Human Monk 4"');
  });

  it("make what could act as markup inert", () => {
    const character = characterWith({ size: null, creatureType: null, alignment: null, species: "`= this`" });
    expect(new TypeProperty().lineOf(character)).toBe('type: "\\\\`= this\\\\`"');
  });
});
