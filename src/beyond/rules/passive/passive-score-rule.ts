import type { ImportedNumber } from "../../shape/imported-number";
import { PASSIVE_SCORE } from "../../shape/import-limits";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import type { Rule } from "../core/rule";
import { unknownAmong } from "../core/unknown-among";
import { sumWorking, withConditional } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import { standardHandlers } from "../modifiers/standard-handlers";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import type { Skill } from "../proficiency/skill";

export class PassiveScoreRule implements Rule {
  constructor(private readonly skill: Skill) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: `Passive ${this.skill.name}`, value: this.passive(character, earlier) }];
  }

  private passive(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const missing = unknownAmong([this.skill.name], earlier, character.route);
    if (missing !== null) return missing;
    const own = `passive-${this.skill.subType}`;
    const tally = tallyModifiers(character.modifiers, new SubTypeFamily([own], []), standardHandlers([own]));
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const skill = earlier.valueOf(this.skill.name, character.route).valueOr(0);
    const total = 10 + skill + tally.added;
    const terms = ["10", `${this.skill.name} ${skill}`, ...tally.applied];
    return numberInRange(total, PASSIVE_SCORE, withConditional(sumWorking(terms, total), tally.conditional), character.route);
  }
}
