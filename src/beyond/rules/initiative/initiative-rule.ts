import type { ImportedNumber } from "../../shape/imported-number";
import { INITIATIVE } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { DEXTERITY } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { proficientCheck } from "../proficiency/proficient-check";

const FAMILY = new SubTypeFamily(["initiative"], []);

export class InitiativeRule implements Rule {
  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: "Initiative", value: this.initiative(character, earlier) }];
  }

  private initiative(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    if (character.features.includes("Alert")) return new NotKnownValue("The Alert feat works differently in the 2014 and 2024 rules, and I can't tell which this is.", character.route);
    return proficientCheck(character, earlier, {
      abilityShort: DEXTERITY.short,
      claim: { subType: "initiative", halfApplies: true },
      family: FAMILY,
      plainSubTypes: ["initiative"],
      range: INITIATIVE,
    });
  }
}
