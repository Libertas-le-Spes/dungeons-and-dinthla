import type { ImportedNumber } from "../shape/imported-number";
import { EarlierNumbers } from "./core/earlier-numbers";
import type { RuleCharacter } from "./input/rule-character";
import { refuseOversize } from "./core/refuse-oversize";
import { RULE_LIST } from "./rule-list";

export function workedOut(character: RuleCharacter): readonly ImportedNumber[] {
  refuseOversize(character);
  const found: ImportedNumber[] = [];
  let earlier = EarlierNumbers.none();
  for (const rule of RULE_LIST) {
    const numbers = rule.workOut(character, earlier);
    found.push(...numbers);
    earlier = earlier.withAll(numbers);
  }
  return found;
}
