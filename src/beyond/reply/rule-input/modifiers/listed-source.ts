import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { numericOf } from "../body/numeric-of";
import { modifierEntryOf } from "./modifier-entry";
import type { ModifierNames } from "./modifier-names";
import type { ModifierSource } from "./modifier-source";

export class ListedSource implements ModifierSource {
  constructor(
    readonly key: string,
    private readonly names: ModifierNames,
  ) {}

  modifiersOf(entries: readonly JsonReader[]): readonly RuleModifier[] {
    return entries.map((entry) => this.modifierOf(entry));
  }

  modifierOf(entry: JsonReader): RuleModifier {
    return modifierEntryOf({ entry, sourceName: this.sourceNameOf(entry), inForce: true });
  }

  private sourceNameOf(entry: JsonReader): CleanLine {
    const found = this.names.get(numericOf(entry.numberAt("componentId")));
    if (found === undefined) return CleanLine.of(this.key);
    return found;
  }
}
