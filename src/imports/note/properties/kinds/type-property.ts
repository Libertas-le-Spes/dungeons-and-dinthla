import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { NeutralText } from "../../../../beyond/text/neutral-text";
import { TYPE_PROPERTY } from "../../../layout/import-properties";
import { quotedYamlOf } from "../helpers/quoted-yaml";
import { typeLineOf } from "../helpers/type-line";
import type { ImportedProperty } from "./imported-property";

export class TypeProperty implements ImportedProperty {
  readonly name = TYPE_PROPERTY;

  lineOf(character: ImportedCharacter): string | null {
    return `${this.name}: ${quotedYamlOf(NeutralText.ofLines(typeLineOf(character)).written)}`;
  }
}
