import type { RuleModifier } from "../../../rules/input/rule-modifier";
import type { JsonReader } from "../../json/json-reader";

export interface ModifierSource {
  readonly key: string;
  modifiersOf(entries: readonly JsonReader[]): readonly RuleModifier[];
}
