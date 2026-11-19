import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { NeutralText } from "../../../../beyond/text/neutral-text";
import { ALIGNMENT_PROPERTY } from "../../../layout/import-properties";
import type { ImportedProperty } from "./imported-property";
import { quotedYamlOf } from "../helpers/quoted-yaml";

export class AlignmentProperty implements ImportedProperty {
  readonly name = ALIGNMENT_PROPERTY;

  lineOf(character: ImportedCharacter): string | null {
    if (character.alignment === null) return null;
    return `${this.name}: ${quotedYamlOf(NeutralText.ofOneLine(character.alignment).written)}`;
  }
}
