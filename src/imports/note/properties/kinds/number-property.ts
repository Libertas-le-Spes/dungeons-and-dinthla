import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { knownNumberLineOf } from "../helpers/known-number-line";
import type { ImportedProperty } from "./imported-property";

export class NumberProperty implements ImportedProperty {
  constructor(
    readonly name: string,
    private readonly numberName: string,
  ) {}

  lineOf(character: ImportedCharacter): string | null {
    for (const number of character.numbers) {
      if (number.name === this.numberName) return knownNumberLineOf(this.name, number.value);
    }
    return null;
  }
}
