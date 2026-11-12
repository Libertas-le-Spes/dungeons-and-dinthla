import { KnownValue } from "../../shape/known-value";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import { draconicSorcerers } from "../classes/draconic-sorcerer";
import { isTwentyFourteen } from "../input/edition";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleClass } from "../input/rule-class";
import type { PerLevelSource } from "./per-level-source";

function addedLevel(total: number, ruleClass: RuleClass): number {
  return total + ruleClass.level;
}

export class DraconicResilience implements PerLevelSource {
  readonly sourceName = "Draconic Resilience";

  addition(character: RuleCharacter): WorkedValue<number> | null {
    const sorcerers = draconicSorcerers(character.classes);
    if (sorcerers.length === 0) return null;
    if (!isTwentyFourteen(character.edition)) return new NotKnownValue("Draconic Resilience is worked differently in the 2014 and 2024 rules, and the edition is not 2014.", character.route);
    const levels = sorcerers.reduce(addedLevel, 0);
    return KnownValue.wholeNumber(levels, `Draconic Resilience 1 x ${levels}`, character.route);
  }
}
