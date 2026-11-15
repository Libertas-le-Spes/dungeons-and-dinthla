import { hasFeature } from "../../core/has-feature";
import { sameName } from "../../core/same-name";
import type { RuleCharacter } from "../../input/rule-character";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ArmourBonus } from "./armour-bonus";
import type { WornArmour } from "../choice/worn-armour";

const FEATURE = "Defense";

function isCountedModifier(modifier: RuleModifier): boolean {
  if (!modifier.inForce) return false;
  if (modifier.subType.text !== "armor-class") return false;
  if (modifier.restriction.trim() !== "") return false;
  return sameName(modifier.sourceName.text, FEATURE);
}

export class DefenceStyleBonus implements ArmourBonus {
  readonly term = "Defense 1";
  readonly amount = 1;

  appliesTo(character: RuleCharacter, worn: WornArmour): boolean {
    if (worn.body.length === 0) return false;
    if (character.modifiers.some(isCountedModifier)) return false;
    return hasFeature(character, FEATURE);
  }
}
