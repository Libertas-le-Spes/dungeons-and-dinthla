import { BARBARIAN_NAME, MONK_NAME } from "../../classes/class-names";
import { hasClass } from "../../classes/has-class";
import { sameName } from "../../core/same-name";
import { CONSTITUTION, WISDOM } from "../../input/ability";
import type { Ability } from "../../input/ability";
import type { RuleCharacter } from "../../input/rule-character";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../../modifiers/modifier-handler";

interface OwnDefence {
  readonly className: string;
  readonly ability: Ability;
}

const OWN_DEFENCES: readonly OwnDefence[] = [
  { className: MONK_NAME, ability: WISDOM },
  { className: BARBARIAN_NAME, ability: CONSTITUTION },
];

export class OwnDefenceModifier implements ModifierHandler {
  constructor(private readonly character: RuleCharacter) {}

  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "set") return false;
    if (modifier.subType.text !== "unarmored-armor-class") return false;
    if (!sameName(modifier.sourceName.text, "Unarmored Defense")) return false;
    return OWN_DEFENCES.some((defence) => this.isDefenceOf(defence, modifier));
  }

  applyTo(): void {}

  private isDefenceOf(defence: OwnDefence, modifier: RuleModifier): boolean {
    if (modifier.ability !== defence.ability.short) return false;
    return hasClass(this.character, defence.className);
  }
}
