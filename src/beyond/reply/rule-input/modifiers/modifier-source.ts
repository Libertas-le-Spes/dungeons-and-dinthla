import type { RuleModifier } from "../../../rules/input/rule-modifier";
import type { JsonReader } from "../../json/json-reader";

export interface ModifierSource {
  readonly key: string;
  keeps(entry: JsonReader): boolean;
  modifierOf(entry: JsonReader): RuleModifier;
}
