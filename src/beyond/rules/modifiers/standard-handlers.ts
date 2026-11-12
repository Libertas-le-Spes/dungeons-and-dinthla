import { MODIFIER_VALUE } from "../../shape/import-limits";
import type { NumberRange } from "../../shape/number-range";
import { IgnoredTypes } from "./handlers/ignored-types";
import { NotInForce } from "./handlers/not-in-force";
import { PlainBonus } from "./handlers/plain-bonus";
import { RestrictedBonus } from "./handlers/restricted-bonus";
import type { ModifierHandler } from "./modifier-handler";

export function standardHandlers(plainSubTypes: readonly string[], extra: readonly ModifierHandler[] = [], allowed: NumberRange = MODIFIER_VALUE): readonly ModifierHandler[] {
  return [new NotInForce(), ...extra, new IgnoredTypes(["advantage", "disadvantage"]), new RestrictedBonus(), new PlainBonus(plainSubTypes, allowed)];
}
