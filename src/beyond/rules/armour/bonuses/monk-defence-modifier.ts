import { MONK_NAME } from "../../classes/class-names";
import { hasClass } from "../../classes/has-class";
import { sameName } from "../../core/same-name";
import type { RuleCharacter } from "../../input/rule-character";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../../modifiers/modifier-handler";

export class MonkDefenceModifier implements ModifierHandler {
  constructor(private readonly character: RuleCharacter) {}

  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "set") return false;
    if (modifier.subType.text !== "unarmored-armor-class") return false;
    if (!sameName(modifier.sourceName.text, "Unarmored Defense")) return false;
    return hasClass(this.character, MONK_NAME);
  }

  applyTo(): void {}
}
