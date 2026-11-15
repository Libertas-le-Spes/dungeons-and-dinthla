import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { modifierEntryOf } from "./modifier-entry";
import type { ModifierNames } from "./modifier-names";
import type { ModifierSource } from "./modifier-source";

export class ListedSource implements ModifierSource {
  constructor(
    readonly key: string,
    private readonly names: ModifierNames,
  ) {}

  keeps(): boolean {
    return true;
  }

  modifierOf(entry: JsonReader): RuleModifier {
    return modifierEntryOf(entry, this.sourceNameOf(entry), true);
  }

  private sourceNameOf(entry: JsonReader): CleanLine {
    const id = entry.numberAt("componentId");
    if (id === null) return CleanLine.of(this.key);
    const found = this.names.get(id);
    if (found === undefined) return CleanLine.of(this.key);
    return found;
  }
}
