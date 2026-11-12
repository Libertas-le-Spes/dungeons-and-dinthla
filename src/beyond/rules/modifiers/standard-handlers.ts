import { IgnoredTypes } from "./handlers/ignored-types";
import { NotApplyingNow } from "./handlers/not-applying-now";
import { PlainBonus } from "./handlers/plain-bonus";
import { RestrictedBonus } from "./handlers/restricted-bonus";
import type { ModifierHandler } from "./modifier-handler";

export function standardHandlers(plainSubTypes: readonly string[], extra: readonly ModifierHandler[] = []): readonly ModifierHandler[] {
  return [new NotApplyingNow(), ...extra, new IgnoredTypes(["advantage", "disadvantage"]), new RestrictedBonus(), new PlainBonus(plainSubTypes)];
}
