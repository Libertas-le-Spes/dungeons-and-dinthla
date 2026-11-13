import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { knownNumberLineOf } from "../helpers/known-number-line";
import type { ImportedProperty } from "./imported-property";
import type { ScoreRow } from "../../rows/score-row";

export class ScoreProperty implements ImportedProperty {
  readonly name: string;

  constructor(private readonly row: ScoreRow) {
    this.name = row.name;
  }

  lineOf(character: ImportedCharacter): string | null {
    return knownNumberLineOf(this.name, this.row.valueOf(character.scores));
  }
}
