import { CLASS_COUNT, FEATURE_COUNT, INVENTORY_COUNT, MODIFIER_COUNT } from "../../shape/import-limits";
import { refuseAbove } from "../../shape/refuse-above";
import type { RuleCharacter } from "../input/rule-character";

export function refuseOversize(character: RuleCharacter): void {
  refuseAbove(CLASS_COUNT, character.classes.length);
  refuseAbove(INVENTORY_COUNT, character.items.length);
  refuseAbove(FEATURE_COUNT, character.features.length);
  refuseAbove(MODIFIER_COUNT, character.modifiers.length);
}
