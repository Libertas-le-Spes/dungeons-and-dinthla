import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { NeutralText } from "../../../../beyond/text/neutral-text";
import { SUBTITLE_PROPERTY } from "../../../layout/import-properties";
import { quotedYamlOf } from "../helpers/quoted-yaml";
import { subtitleOf } from "../helpers/subtitle-line";
import type { ImportedProperty } from "./imported-property";

export class SubtitleProperty implements ImportedProperty {
  readonly name = SUBTITLE_PROPERTY;

  lineOf(character: ImportedCharacter): string | null {
    return `${this.name}: ${quotedYamlOf(NeutralText.ofLines(subtitleOf(character)).written)}`;
  }
}
