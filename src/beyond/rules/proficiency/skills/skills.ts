import { CHARISMA, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../input/ability";
import { Skill } from "./skill";

export const PERCEPTION = new Skill("Perception", WISDOM, "perception");
export const INVESTIGATION = new Skill("Investigation", INTELLIGENCE, "investigation");
export const INSIGHT = new Skill("Insight", WISDOM, "insight");

export const ACROBATICS = new Skill("Acrobatics", DEXTERITY, "acrobatics");
export const ANIMAL_HANDLING = new Skill("Animal Handling", WISDOM, "animal-handling");
export const ARCANA = new Skill("Arcana", INTELLIGENCE, "arcana");
export const ATHLETICS = new Skill("Athletics", STRENGTH, "athletics");
export const DECEPTION = new Skill("Deception", CHARISMA, "deception");
export const HISTORY = new Skill("History", INTELLIGENCE, "history");
export const INTIMIDATION = new Skill("Intimidation", CHARISMA, "intimidation");
export const MEDICINE = new Skill("Medicine", WISDOM, "medicine");
export const NATURE = new Skill("Nature", INTELLIGENCE, "nature");
export const PERFORMANCE = new Skill("Performance", CHARISMA, "performance");
export const PERSUASION = new Skill("Persuasion", CHARISMA, "persuasion");
export const RELIGION = new Skill("Religion", INTELLIGENCE, "religion");
export const SLEIGHT_OF_HAND = new Skill("Sleight of Hand", DEXTERITY, "sleight-of-hand");
export const STEALTH = new Skill("Stealth", DEXTERITY, "stealth");
export const SURVIVAL = new Skill("Survival", WISDOM, "survival");

export const SKILLS: readonly Skill[] = [
  ACROBATICS,
  ANIMAL_HANDLING,
  ARCANA,
  ATHLETICS,
  DECEPTION,
  HISTORY,
  INSIGHT,
  INTIMIDATION,
  INVESTIGATION,
  MEDICINE,
  NATURE,
  PERCEPTION,
  PERFORMANCE,
  PERSUASION,
  RELIGION,
  SLEIGHT_OF_HAND,
  STEALTH,
  SURVIVAL,
];
