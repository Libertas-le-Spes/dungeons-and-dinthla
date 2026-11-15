import { NotKnownValue } from "../../shape/not-known-value";
import type { ImportedNumber } from "../../shape/imported-number";
import { ONLINE } from "../common/online-route";
import type { Blanket } from "../rule-input/hand-set/blanket";
import type { RuleInputs } from "./rule-inputs";

function replacedByName(replacements: readonly ImportedNumber[]): (number: ImportedNumber) => ImportedNumber {
  return function replace(number: ImportedNumber): ImportedNumber {
    const found = replacements.find((candidate) => candidate.name === number.name);
    if (found === undefined) return number;
    return found;
  };
}

function blanketedBy(blankets: readonly Blanket[]): (number: ImportedNumber) => ImportedNumber {
  return function blanket(number: ImportedNumber): ImportedNumber {
    const covering = blankets.find((candidate) => candidate.covers(number.name));
    if (covering === undefined) return number;
    return { name: number.name, value: new NotKnownValue(covering.reason, ONLINE) };
  };
}

export function withDoubts(numbers: readonly ImportedNumber[], inputs: RuleInputs): readonly ImportedNumber[] {
  return numbers
    .map(blanketedBy(inputs.handSet.blankets))
    .map(replacedByName(inputs.doubts))
    .map(replacedByName(inputs.handSet.setByHand));
}
