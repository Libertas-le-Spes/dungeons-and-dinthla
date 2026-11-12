import type { ImportedNumber } from "../../shape/imported-number";
import { INITIATIVE } from "../../shape/import-limits";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { INITIATIVE_NAME } from "../core/number-names";
import type { Rule } from "../core/rule";
import { INITIATIVE_TOUCHING } from "../core/touching-lists";
import { DEXTERITY } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { proficientCheck } from "../proficiency/proficient-check";

const NAMES = ["initiative", "ability-checks"];
const FAMILY = new SubTypeFamily(NAMES, []);

export class InitiativeRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const touching = INITIATIVE_TOUCHING.unknownFor(character);
    if (touching !== null) return [{ name: INITIATIVE_NAME, value: touching }];
    const value = proficientCheck(character, earlier, {
      ability: DEXTERITY,
      claim: { subType: "initiative", halfApplies: true },
      family: FAMILY,
      plainSubTypes: NAMES,
      range: INITIATIVE,
    });
    return [{ name: INITIATIVE_NAME, value }];
  }
}
