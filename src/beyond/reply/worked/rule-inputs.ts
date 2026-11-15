import type { ImportedNumber } from "../../shape/imported-number";
import type { RuleCharacter } from "../../rules/input/rule-character";
import type { HandSet } from "../rule-input/hand-set/read-hand-set";

export interface RuleInputs {
  readonly character: RuleCharacter;
  readonly doubts: readonly ImportedNumber[];
  readonly handSet: HandSet;
}
