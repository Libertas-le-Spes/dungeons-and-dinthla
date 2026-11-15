import type { NotKnownValue } from "../../../shape/not-known-value";
import { notKnown } from "../../core/worked";
import { shortList } from "../../core/working-text";
import type { RuleCharacter } from "../../input/rule-character";
import type { RuleItem } from "../../input/rule-item";
import type { WornArmour } from "./worn-armour";

function nameOf(item: RuleItem): string {
  return item.name.text;
}

function namesOf(items: readonly RuleItem[]): string {
  return shortList(items.map(nameOf));
}

export function conflictIn(worn: WornArmour, character: RuleCharacter): NotKnownValue<number> | null {
  if (worn.body.length > 1) return notKnown(`More than one body armour worn (${namesOf(worn.body)}). Settle it on D&D Beyond.`, character.route);
  if (worn.shields.length > 1) return notKnown(`More than one shield held (${namesOf(worn.shields)}). Settle it on D&D Beyond.`, character.route);
  return null;
}
