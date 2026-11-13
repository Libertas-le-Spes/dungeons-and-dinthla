import type { RuleCharacter } from "../../input/rule-character";
import type { RuleItem } from "../../input/rule-item";

export interface WornArmour {
  readonly body: readonly RuleItem[];
  readonly shields: readonly RuleItem[];
}

function isWorn(item: RuleItem): boolean {
  if (!item.equipped) return false;
  if (!item.needsAttunement) return true;
  return item.attuned;
}

function isBodyArmour(item: RuleItem): boolean {
  return item.armour.isBody;
}

function isShield(item: RuleItem): boolean {
  return item.armour.isShield;
}

export function wornArmourOf(character: RuleCharacter): WornArmour {
  const worn = character.items.filter(isWorn);
  return { body: worn.filter(isBodyArmour), shields: worn.filter(isShield) };
}
