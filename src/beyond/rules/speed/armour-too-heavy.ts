import type { NotKnownValue } from "../../shape/not-known-value";
import { wornArmourOf } from "../armour/choice/worn-armour";
import { notKnown } from "../core/worked";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleItem } from "../input/rule-item";

function isTooHeavyFor(strength: number): (item: RuleItem) => boolean {
  return function isTooHeavy(item: RuleItem): boolean {
    if (!Number.isFinite(item.strengthRequired)) return true;
    return item.strengthRequired > strength;
  };
}

export function armourTooHeavy(character: RuleCharacter, strength: number): NotKnownValue<number> | null {
  const heavy = wornArmourOf(character).body.find(isTooHeavyFor(strength));
  if (heavy === undefined) return null;
  return notKnown(`${heavy.name.text} may slow speed. Type it on your note.`, character.route);
}
