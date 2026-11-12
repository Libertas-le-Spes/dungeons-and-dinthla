import { SORCERER_NAME, WARLOCK_NAME } from "../../classes/class-names";
import { CHARISMA, INTELLIGENCE, WISDOM } from "../../input/ability";
import { CasterClass } from "./caster-class";
import { FullCaster } from "./full-caster";
import { HalfCaster } from "./half-caster";
import { PactCaster } from "./pact-caster";
import { ThirdCaster } from "./third-caster";

const FULL = new FullCaster();
const HALF = new HalfCaster();
const THIRD = new ThirdCaster();
const PACT = new PactCaster();

export const CASTER_CLASSES: readonly CasterClass[] = [
  new CasterClass("Bard", "", CHARISMA, FULL),
  new CasterClass("Cleric", "", WISDOM, FULL),
  new CasterClass("Druid", "", WISDOM, FULL),
  new CasterClass(SORCERER_NAME, "", CHARISMA, FULL),
  new CasterClass("Wizard", "", INTELLIGENCE, FULL),
  new CasterClass("Paladin", "", CHARISMA, HALF),
  new CasterClass("Ranger", "", WISDOM, HALF),
  new CasterClass("Fighter", "Eldritch Knight", INTELLIGENCE, THIRD),
  new CasterClass("Rogue", "Arcane Trickster", INTELLIGENCE, THIRD),
  new CasterClass(WARLOCK_NAME, "", CHARISMA, PACT),
];
