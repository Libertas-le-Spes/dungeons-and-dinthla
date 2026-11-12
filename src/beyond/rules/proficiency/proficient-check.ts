import type { NumberRange } from "../../shape/number-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import { PROFICIENCY_BONUS_NAME } from "../core/number-names";
import { knownIn } from "../core/worked";
import { sumWorking, withConditional } from "../core/working-text";
import type { Ability } from "../input/ability";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredTypes } from "../modifiers/handlers/ignored-types";
import type { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyFor } from "../modifiers/tally-for";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { grantFor } from "./grants/grant-for";
import type { ProficiencyClaim } from "./grants/proficiency-grant";

export interface ProficientCheck {
  readonly ability: Ability;
  readonly claim: ProficiencyClaim;
  readonly family: SubTypeFamily;
  readonly plainSubTypes: readonly string[];
  readonly range: NumberRange;
}

const GRANTED_TYPES = new IgnoredTypes(["proficiency", "expertise"]);

export function proficientCheck(character: RuleCharacter, earlier: EarlierNumbers, check: ProficientCheck): WorkedValue<number> {
  const needed = NeededNumbers.of([check.ability.modifierName, PROFICIENCY_BONUS_NAME], earlier, character.route);
  if (needed.missing !== null) return needed.missing;
  const tally = tallyFor(character, check.family, check.plainSubTypes, [GRANTED_TYPES]);
  const unfamiliar = unknownModifiers(tally, character.route);
  if (unfamiliar !== null) return unfamiliar;
  const modifier = needed.numberOf(check.ability.modifierName);
  const bonus = needed.numberOf(PROFICIENCY_BONUS_NAME);
  const grant = grantFor(character, check.claim);
  const total = modifier + grant.shareOf(bonus) + tally.added;
  const terms = [`${check.ability.short} ${modifier}`, ...grant.termsFor(bonus), ...tally.applied];
  return knownIn(total, check.range, withConditional(sumWorking(terms, total), tally.conditional), character.route);
}
