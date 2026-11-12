import { AbilityTable } from "../../../src/beyond/rules/input/by-ability";
import { CHARISMA, CONSTITUTION, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../../src/beyond/rules/input/ability";
import type { ArmourKind } from "../../../src/beyond/rules/input/armour/armour-kind";
import { NotArmour } from "../../../src/beyond/rules/input/armour/not-armour";
import type { RuleCharacter } from "../../../src/beyond/rules/input/rule-character";
import type { RuleClass } from "../../../src/beyond/rules/input/rule-class";
import type { RuleItem } from "../../../src/beyond/rules/input/rule-item";
import type { RuleModifier } from "../../../src/beyond/rules/input/rule-modifier";
import { workedOut } from "../../../src/beyond/rules/worked-out";
import type { WorkedValue } from "../../../src/beyond/shape/worked-value";
import { Online } from "../../../src/beyond/shape/route";

export const ROUTE = new Online();

export function scoresOf(strength: number, dexterity: number, constitution: number, intelligence: number, wisdom: number, charisma: number): AbilityTable<number> {
  return new AbilityTable<number>()
    .with(STRENGTH, strength)
    .with(DEXTERITY, dexterity)
    .with(CONSTITUTION, constitution)
    .with(INTELLIGENCE, intelligence)
    .with(WISDOM, wisdom)
    .with(CHARISMA, charisma);
}

export function noBonuses(): AbilityTable<number> {
  return scoresOf(0, 0, 0, 0, 0, 0);
}

export function classOf(name: string, level: number, hitDie: number, subclass = ""): RuleClass {
  return { name, subclass, level, hitDie };
}

export function itemOf(name: string, armour: ArmourKind, armourClass: number): RuleItem {
  return { name, equipped: true, attuned: false, needsAttunement: false, armour, armourClass, strengthRequired: 0 };
}

export function otherItem(name: string): RuleItem {
  return itemOf(name, new NotArmour(), 0);
}

export function modifierOf(type: string, subType: string, value: number | null, sourceName: string, restriction = ""): RuleModifier {
  return { type, subType, value, restriction, sourceName, appliesNow: true };
}

export function madeUpRuleCharacter(changes: Partial<RuleCharacter> = {}): RuleCharacter {
  return {
    route: ROUTE,
    edition: "2014",
    species: "Human",
    classes: [classOf("Fighter", 1, 10)],
    baseScores: scoresOf(10, 10, 10, 10, 10, 10),
    bonusScores: noBonuses(),
    scoreOverrides: new AbilityTable<number>(),
    baseHitPoints: 10,
    bonusHitPoints: 0,
    overrideHitPoints: null,
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    walkingSpeed: 30,
    items: [],
    modifiers: [],
    features: [],
    ...changes,
  };
}

export function numberNamed(character: RuleCharacter, name: string): WorkedValue<number> {
  const found = workedOut(character).find((number) => number.name === name);
  if (found === undefined) throw new Error(`The rules worked out no number named ${name}.`);
  return found.value;
}

export function namesWorkedOut(character: RuleCharacter): string[] {
  return workedOut(character).map((number) => number.name);
}

