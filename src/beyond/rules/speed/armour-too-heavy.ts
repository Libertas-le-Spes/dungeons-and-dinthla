import { NotKnownValue } from "../../shape/not-known-value";
import { wornArmourOf } from "../armour/choice/worn-armour";
import type { RuleCharacter } from "../input/rule-character";
import type { RuleItem } from "../input/rule-item";

function isTooHeavy(strength: number, item: RuleItem): boolean {
  return item.strengthRequired > strength;
}

export function armourTooHeavy(character: RuleCharacter, strength: number): NotKnownValue<number> | null {
  const heavy = wornArmourOf(character).body.find((item) => isTooHeavy(strength, item));
  if (heavy === undefined) return null;
  return new NotKnownValue(`${heavy.name} needs Strength ${heavy.strengthRequired}, and it is more than ${strength}. I don't work out what that does to speed.`, character.route);
}
