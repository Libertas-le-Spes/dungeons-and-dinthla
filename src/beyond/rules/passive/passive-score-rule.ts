import type { ImportedNumber } from "../../shape/imported-number";
import { PASSIVE_SCORE } from "../../shape/import-limits";
import type { WorkedValue } from "../../shape/worked-value";
import type { EarlierNumbers } from "../core/earlier-numbers";
import { NeededNumbers } from "../core/needed-numbers";
import type { Rule } from "../core/rule";
import { knownIn } from "../core/worked";
import { sumWorking, withConditional } from "../core/working-text";
import type { RuleCharacter } from "../input/rule-character";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyFor } from "../modifiers/tally-for";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import type { Skill } from "../proficiency/skills/skill";

export class PassiveScoreRule implements Rule {
  private readonly own: string;

  constructor(private readonly skill: Skill) {
    this.own = `passive-${skill.subType}`;
  }

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    return [{ name: this.skill.passiveName, value: this.passive(character, earlier) }];
  }

  private passive(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    const needed = NeededNumbers.of([this.skill.name], earlier, character.route);
    if (needed.missing !== null) return needed.missing;
    const tally = tallyFor(character, new SubTypeFamily([this.own], []), [this.own]);
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const skill = needed.numberOf(this.skill.name);
    const total = 10 + skill + tally.added;
    const terms = ["10", `${this.skill.name} ${skill}`, ...tally.applied];
    return knownIn(total, PASSIVE_SCORE, withConditional(sumWorking(terms, total), tally.conditional), character.route);
  }
}
