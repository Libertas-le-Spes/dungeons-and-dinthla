import type { ArmourKind } from "../../../rules/input/armour/armour-kind";
import { HeavyArmour } from "../../../rules/input/armour/heavy-armour";
import { LightArmour } from "../../../rules/input/armour/light-armour";
import { MediumArmour } from "../../../rules/input/armour/medium-armour";
import { NotArmour } from "../../../rules/input/armour/not-armour";
import { Shield } from "../../../rules/input/armour/shield";
import type { JsonReader } from "../../json/json-reader";
import { numericOf } from "../body/numeric-of";

const ARMOUR_KINDS: ReadonlyMap<number, ArmourKind> = new Map<number, ArmourKind>([
  [1, new LightArmour()],
  [2, new MediumArmour()],
  [3, new HeavyArmour()],
  [4, new Shield()],
]);

export function armourKindOf(definition: JsonReader): ArmourKind | undefined {
  if (definition.holdsNothingAt("armorTypeId")) return new NotArmour();
  return ARMOUR_KINDS.get(numericOf(definition.numberAt("armorTypeId")));
}
