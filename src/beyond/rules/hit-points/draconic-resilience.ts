import { knownNumber, notKnown } from "../core/worked";
import type { WorkedValue } from "../../shape/worked-value";
import { draconicSorcerers } from "../classes/draconic-sorcerer";
import { EDITION_NOT_2014, isTwentyFourteen } from "../input/edition";
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
    if (!isTwentyFourteen(character.edition)) return notKnown(EDITION_NOT_2014, character.route);
    const levels = sorcerers.reduce(addedLevel, 0);
    return knownNumber(levels, `Draconic Resilience 1 x ${levels}`, character.route);
  }
}
