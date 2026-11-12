import { CHARISMA, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../input/ability";
import { Skill } from "./skill";

export const PERCEPTION = new Skill("Perception", WISDOM, "perception");
export const INVESTIGATION = new Skill("Investigation", INTELLIGENCE, "investigation");
export const INSIGHT = new Skill("Insight", WISDOM, "insight");

export const SKILLS: readonly Skill[] = [
  new Skill("Acrobatics", DEXTERITY, "acrobatics"),
  new Skill("Animal Handling", WISDOM, "animal-handling"),
  new Skill("Arcana", INTELLIGENCE, "arcana"),
  new Skill("Athletics", STRENGTH, "athletics"),
  new Skill("Deception", CHARISMA, "deception"),
  new Skill("History", INTELLIGENCE, "history"),
  INSIGHT,
  new Skill("Intimidation", CHARISMA, "intimidation"),
  INVESTIGATION,
  new Skill("Medicine", WISDOM, "medicine"),
  new Skill("Nature", INTELLIGENCE, "nature"),
  PERCEPTION,
  new Skill("Performance", CHARISMA, "performance"),
  new Skill("Persuasion", CHARISMA, "persuasion"),
  new Skill("Religion", INTELLIGENCE, "religion"),
  new Skill("Sleight of Hand", DEXTERITY, "sleight-of-hand"),
  new Skill("Stealth", DEXTERITY, "stealth"),
  new Skill("Survival", WISDOM, "survival"),
];
