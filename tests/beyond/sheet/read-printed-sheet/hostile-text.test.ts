import { describe, expect, it } from "vitest";
import { NeutralText } from "../../../../src/beyond/text/neutral-text";
import { MadeUpSheet } from "../../builders/made-up-sheet";
import { readOf, textOf } from "../../builders/sheet-reading";
import type { ImportedCharacter } from "../../../../src/beyond/shape/imported-character";

const HOSTILE = "<b>Hostile</b>\u0007‮ [[Link]] <script>x</script>\r\nSecond line";
const KEPT = ["CharacterName", "RACE", "CLASS  LEVEL", "spellCastingClass0"];

function allTexts(character: ImportedCharacter): string[] {
  const texts = [character.name.text, character.species.text];
  for (const found of character.classes) texts.push(found.name.text, found.level.explanation);
  for (const number of character.numbers) texts.push(number.name, number.value.explanation);
  for (const item of character.inventory) texts.push(item.name.text, item.count.explanation);
  for (const line of [...character.spells, ...character.features]) texts.push(line.text);
  return texts;
}

function hostileEverywhere(): MadeUpSheet {
  const sheet = MadeUpSheet.monk();
  for (const name of sheet.names()) {
    if (!KEPT.includes(name)) sheet.with(name, HOSTILE);
  }
  return sheet;
}

function neutral(line: { text: string }): string {
  return NeutralText.ofLines(line.text).written;
}

describe("reading a sheet with hostile text", () => {
  it("has hostile text in every field but the name come out as plain one-line text", () => {
    for (const text of allTexts(readOf(hostileEverywhere()))) {
      expect(text).not.toMatch(/[<>\u0000-\u0009\u000b-\u001f\u007f‮\n\r]/u);
    }
  });

  it("has hostile text in a feature, a spell and an item written to a note as neutral text", () => {
    const sheet = MadeUpSheet.empty().with("CharacterName", "Primary Monk").with("RACE", "Human").with("CLASS  LEVEL", "Monk 1");
    sheet.with("FeaturesTraits1", "[[Primary]] ![[Image]] %% #tag ==mark== a::b").with("spellName0", "# Heading").with("Eq Name0", "- [ ] task");
    const character = readOf(sheet);
    const written = [...character.features, ...character.spells, ...character.inventory.map(itemName)].map(neutral);
    expect(written.join("\n")).not.toMatch(/\[\[|%%|==|::|^#|^- /mu);
  });

  it("has the casting class label come out plain as well, in the number names", () => {
    const names = readOf(MadeUpSheet.monk().with("spellCastingClass0", "<b>Wizard</b>\u0007")).numbers.map(textOfName);
    expect(names).toContain("Wizard spell save DC");
  });

  it("has a feature line made of control characters only counted out, not kept", () => {
    expect(readOf(MadeUpSheet.empty().with("CharacterName", "Primary Monk").with("RACE", "Human").with("CLASS  LEVEL", "Monk 1").with("FeaturesTraits1", "\u0007\u0008")).features.map(textOf)).toEqual([]);
  });
});

function itemName(item: { name: { text: string } }): { text: string } {
  return item.name;
}

function textOfName(number: { name: string }): string {
  return number.name;
}
