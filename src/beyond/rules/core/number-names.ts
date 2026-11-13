export const TOTAL_LEVEL_NAME = "Total level";
export const PROFICIENCY_BONUS_NAME = "Proficiency bonus";
export const HIT_DICE_NAME = "Hit dice";
export const MAX_HIT_POINTS_NAME = "HP";
export const CURRENT_HIT_POINTS_NAME = "Current HP";
export const TEMPORARY_HIT_POINTS_NAME = "Temporary HP";
export const ARMOUR_CLASS_NAME = "AC";
export const INITIATIVE_NAME = "Initiative";
export const SPEED_NAME = "Speed";
export const CARRYING_CAPACITY_NAME = "Carrying capacity";
export const SPELL_SLOTS_NAME = "Spell slots";
export const PACT_SLOTS_NAME = "Pact slots";
export const PACT_SLOT_LEVEL_NAME = "Pact slot level";

export function slotLevelNameOf(spellLevel: number): string {
  return `${SPELL_SLOTS_NAME} level ${spellLevel}`;
}
