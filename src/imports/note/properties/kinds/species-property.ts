import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { NeutralText } from "../../../../beyond/text/neutral-text";
import { SPECIES_PROPERTY } from "../../../layout/import-properties";
import type { ImportedProperty } from "./imported-property";
import { quotedYamlOf } from "../helpers/quoted-yaml";

export class SpeciesProperty implements ImportedProperty {
  readonly name = SPECIES_PROPERTY;

  lineOf(character: ImportedCharacter): string | null {
    return `${this.name}: ${quotedYamlOf(NeutralText.ofOneLine(character.species).written)}`;
  }
}
