import type { ImportedNumber } from "../../../shape/imported-number";
import { SPELL_ATTACK, SPELL_SAVE_DC } from "../../../shape/import-limits";
import type { WorkedValue } from "../../../shape/worked-value";
import type { EarlierNumbers } from "../../core/earlier-numbers";
import type { Rule } from "../../core/rule";
import { knownIn, notKnown } from "../../core/worked";
import { reasonedWorking, withConditional } from "../../core/working-text";
import type { RuleCharacter } from "../../input/rule-character";
import { SubTypeFamily } from "../../modifiers/sub-type-family";
import { tallyFor } from "../../modifiers/tally-for";
import { unknownModifiers } from "../../modifiers/unknown-modifiers";
import type { CasterClass } from "../casters/caster-class";
import { castingClassesOf } from "../casters/casting-class";
import type { CastingClass } from "../casters/casting-class";
import { castingInputsOf } from "./casting-inputs";
import type { WorkedKind } from "./worked-kind";

const DC_NAMES = ["spell-save-dc"];
const ATTACK_NAMES = ["spell-attacks"];
const CANNOT_TELL = "Casting unclear in this edition.";

export class SpellcastingRule implements Rule {
  constructor(private readonly caster: CasterClass) {}

  workOut(character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    const found: ImportedNumber[] = [];
    for (const casting of castingClassesOf(character)) {
      if (casting.caster === this.caster) found.push(...this.numbersFor(casting, character, earlier));
    }
    return found;
  }

  private numbersFor(casting: CastingClass, character: RuleCharacter, earlier: EarlierNumbers): readonly ImportedNumber[] {
    if (casting.ruleClass.level < this.caster.kind.firstCastingLevel) return this.beforeCasting(character);
    return [
      { name: this.caster.saveDcName, value: this.saveDc(character, earlier) },
      { name: this.caster.attackName, value: this.attack(character, earlier) },
    ];
  }

  private beforeCasting(character: RuleCharacter): readonly ImportedNumber[] {
    if (this.caster.kind.editionKnows(character.edition)) return [];
    return [
      { name: this.caster.saveDcName, value: notKnown(CANNOT_TELL, character.route) },
      { name: this.caster.attackName, value: notKnown(CANNOT_TELL, character.route) },
    ];
  }

  private reason(): string {
    return `${this.caster.label}, casting with ${this.caster.ability.label}`;
  }

  private saveDc(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    return this.worked(character, earlier, { names: DC_NAMES, range: SPELL_SAVE_DC, start: 8, startTerms: ["8"] });
  }

  private attack(character: RuleCharacter, earlier: EarlierNumbers): WorkedValue<number> {
    return this.worked(character, earlier, { names: ATTACK_NAMES, range: SPELL_ATTACK, start: 0, startTerms: [] });
  }

  private worked(character: RuleCharacter, earlier: EarlierNumbers, kind: WorkedKind): WorkedValue<number> {
    const inputs = castingInputsOf(this.caster, character, earlier);
    if (inputs.missing !== null) return inputs.missing;
    const tally = tallyFor(character, new SubTypeFamily(kind.names, []), kind.names);
    const unfamiliar = unknownModifiers(tally, character.route);
    if (unfamiliar !== null) return unfamiliar;
    const total = kind.start + inputs.bonus + inputs.modifier + tally.added;
    const terms = [...kind.startTerms, ...inputs.terms, ...tally.applied];
    return knownIn(total, kind.range, withConditional(reasonedWorking(terms, total, this.reason()), tally.conditional), character.route);
  }
}
