import type { ImportedNumber } from "../../shape/imported-number";

function replacedBy(doubts: readonly ImportedNumber[]): (number: ImportedNumber) => ImportedNumber {
  return function replace(number: ImportedNumber): ImportedNumber {
    const doubt = doubts.find((candidate) => candidate.name === number.name);
    if (doubt === undefined) return number;
    return doubt;
  };
}

export function withDoubts(numbers: readonly ImportedNumber[], doubts: readonly ImportedNumber[]): readonly ImportedNumber[] {
  return numbers.map(replacedBy(doubts));
}
