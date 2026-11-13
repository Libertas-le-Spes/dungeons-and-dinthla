import type { FieldValue } from "../../../src/pdf/fields/field-value";
import { ITEM_ROW_COUNT, SHEET_PURSE, SHEET_SCORES } from "./sheet-others";
import { SHEET_NUMBERS } from "./sheet-numbers";

export const FEATURE_FIELD_NAMES = ["FeaturesTraits1", "FeaturesTraits2", "FeaturesTraits3"];

function spellFieldNames(): string[] {
  const names: string[] = [];
  for (let number = 0; number <= 4; number += 1) names.push(`spellName${number}`);
  for (let number = 8; number <= 49; number += 1) names.push(`SpellName${number}`);
  return names;
}

export const SPELL_FIELD_NAMES = spellFieldNames();

export class MadeUpSheet {
  private constructor(private readonly values: Map<string, FieldValue>) {}

  static monk(): MadeUpSheet {
    const values = new Map<string, FieldValue>();
    values.set("CharacterName", "Primary Monk");
    values.set("RACE", "Human");
    values.set("CLASS  LEVEL", "Monk 4");
    values.set("spellCastingClass0", "Monk");
    for (const score of SHEET_SCORES) values.set(score.field, score.printed);
    for (const number of SHEET_NUMBERS) values.set(number.field, number.printed);
    for (const coin of SHEET_PURSE) values.set(coin.field, coin.printed);
    for (let row = 0; row < ITEM_ROW_COUNT; row += 1) {
      values.set(`Eq Name${row}`, `Item ${row}`);
      values.set(`Eq Qty${row}`, String(row + 1));
    }
    for (const name of SPELL_FIELD_NAMES) values.set(name, `Spell of ${name}`);
    for (const [position, name] of FEATURE_FIELD_NAMES.entries()) values.set(name, `Feature ${position}a\nFeature ${position}b`);
    return new MadeUpSheet(values);
  }

  static empty(): MadeUpSheet {
    return new MadeUpSheet(new Map());
  }

  with(name: string, value: FieldValue): this {
    this.values.set(name, value);
    return this;
  }

  without(name: string): this {
    this.values.delete(name);
    return this;
  }

  fields(): ReadonlyMap<string, FieldValue> {
    return new Map(this.values);
  }

  names(): string[] {
    return [...this.values.keys()];
  }
}
