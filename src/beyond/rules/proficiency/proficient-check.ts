import type { NumberRange } from "../../shape/number-range";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { unknownAmong } from "../core/unknown-among";
import { sumWorking, withConditional } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredTypes } from "../modifiers/handlers/ignored-types";
import { standardHandlers } from "../modifiers/standard-handlers";
import type { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { grantFor } from "./grants/grant-for";
import type { ProficiencyClaim } from "./grants/proficiency-grant";

export interface ProficientCheck {
  readonly abilityShort: string;
  readonly claim: ProficiencyClaim;
  readonly family: SubTypeFamily;
  readonly plainSubTypes: readonly string[];
  readonly range: NumberRange;
}

export function proficientCheck(character: RuleCharacter, earlier: EarlierNumbers, check: ProficientCheck): WorkedValue<number> {
  const missing = unknownAmong([`${check.abilityShort} modifier`, "Proficiency bonus"], earlier, character.route);
  if (missing !== null) return missing;
  const handlers = standardHandlers(check.plainSubTypes, [new IgnoredTypes(["proficiency", "expertise"])]);
  const tally = tallyModifiers(character.modifiers, check.family, handlers);
  const unfamiliar = unknownModifiers(tally, character.route);
  if (unfamiliar !== null) return unfamiliar;
  const modifier = earlier.valueOf(`${check.abilityShort} modifier`, character.route).valueOr(0);
  const bonus = earlier.valueOf("Proficiency bonus", character.route).valueOr(0);
  const grant = grantFor(character, check.claim);
  const total = modifier + grant.shareOf(bonus) + tally.added;
  const terms = [`${check.abilityShort} ${modifier}`, ...grant.termsFor(bonus), ...tally.applied];
  return numberInRange(total, check.range, withConditional(sumWorking(terms, total), tally.conditional), character.route);
}
