import type { Edition } from "../input/edition";
import { SKILLS } from "../proficiency/skills/skills";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { FeatureTouching } from "./feature-touching";
import { ModelledTouching } from "./modelled-touching";

const NO_EFFECT_IN_2024 = new Map<string, Edition>([["Remarkable Athlete", "2024"]]);

export const ARMOUR_CLASS_TOUCHING = new FeatureTouching([
  "Medium Armor Master",
  "Soul of the Forge",
  "Dual Wielder",
  "Bladesong",
  "Autognome",
  "Lizardfolk",
  "Locathah",
  "Loxodon",
  "Simic Hybrid",
  "Thri-kreen",
  "Tortle",
  "Warforged",
]);

export const SAVING_THROW_TOUCHING = new FeatureTouching(["Aura of Protection"]);
export const SKILL_TOUCHING = new ModelledTouching({
  names: ["Remarkable Athlete"],
  family: new SubTypeFamily([...SKILLS.map((skill) => skill.subType), "ability-checks", "skill-checks"], []),
  modelled: [],
  noEffectIn: NO_EFFECT_IN_2024,
});
export const INITIATIVE_TOUCHING = new ModelledTouching({
  names: ["Alert", "Remarkable Athlete", "Rakish Audacity", "Dread Ambusher", "Tactical Wit"],
  family: new SubTypeFamily(["initiative", "ability-checks"], []),
  modelled: ["Alert"],
  noEffectIn: NO_EFFECT_IN_2024,
});
export const SPEED_TOUCHING = new FeatureTouching(["Mobile", "Fast Movement", "Unarmored Movement", "Unarmored Movement Improvement", "Roving", "Aura of Alacrity", "Drunken Technique", "Speedy", "Squat Nimbleness"]);
export const SPELLCASTING_TOUCHING = new FeatureTouching(["Artificer"], "is not built here yet");
