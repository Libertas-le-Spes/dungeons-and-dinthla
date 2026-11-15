import type { ImportedNumber } from "../../shape/imported-number";
import type { RuleCharacter } from "../../rules/input/rule-character";

export interface RuleInputs {
  readonly character: RuleCharacter;
  readonly doubts: readonly ImportedNumber[];
}
