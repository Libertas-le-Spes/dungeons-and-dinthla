import type { ImportedCharacter } from "../../../../beyond/shape/imported-character";
import { NeutralText } from "../../../../beyond/text/neutral-text";
import { CLASS_PROPERTY } from "../../../layout/import-properties";
import { classLabelOf } from "../helpers/class-label";
import type { ImportedProperty } from "./imported-property";
import { quotedYamlOf } from "../helpers/quoted-yaml";

const BETWEEN_CLASSES = " / ";

function labelsOf(character: ImportedCharacter): string[] {
  const labels: string[] = [];
  for (const imported of character.classes) labels.push(classLabelOf(imported));
  return labels;
}

export class ClassProperty implements ImportedProperty {
  readonly name = CLASS_PROPERTY;

  lineOf(character: ImportedCharacter): string | null {
    if (character.classes.length === 0) return null;
    const joined = labelsOf(character).join(BETWEEN_CLASSES);
    return `${this.name}: ${quotedYamlOf(NeutralText.ofLines(joined).written)}`;
  }
}
