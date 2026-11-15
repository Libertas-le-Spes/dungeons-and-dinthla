export type Node = Record<string, unknown>;

export const BACKSTORY_MARKER = "Mira grew up beneath the Pale Moon";
export const TRAIT_MARKER = "Primary is always calm";

const SIX = [1, 2, 3, 4, 5, 6];

function scoreList(value: number | null): Node[] {
  return SIX.map((id) => ({ id, value }));
}

function scoreEntries(...values: number[]): Node[] {
  return values.map((value, index) => ({ id: index + 1, value }));
}

function named(name: string, quantity: number): Node {
  return { quantity, equipped: false, isAttuned: false, definition: { id: 0, name, canAttune: false, armorTypeId: null, armorClass: null, strengthRequirement: null } };
}

function featureOf(id: number, name: string, requiredLevel: number): Node {
  return { definition: { id, name, requiredLevel } };
}

function modifierOf(type: string, subType: string, componentId: number, value: number | null): Node {
  return { type, subType, value, restriction: "", requiresAttunement: false, componentId };
}

function definedAs(name: string): Node {
  return { definition: { name } };
}

export function madeUpData(): Node {
  return {
    id: 4242,
    name: "Primary Monk",
    race: { fullName: "Human", sizeId: 4, racialTraits: [{ definition: { id: 600, name: "Quick Learner" } }], weightSpeeds: { normal: { walk: 30 }, override: null } },
    background: { definition: { id: 800, name: "Hermit" } },
    classes: [
      {
        level: 1,
        isStartingClass: true,
        subclassDefinition: null,
        definition: { name: "Monk", hitDice: 8 },
        classFeatures: [featureOf(900, "Unarmored Defense", 1), featureOf(901, "Unarmored Movement", 2)],
      },
    ],
    stats: scoreEntries(10, 16, 12, 8, 14, 10),
    bonusStats: scoreList(null),
    overrideStats: scoreList(null),
    baseHitPoints: 12,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    inventory: [named("Quarterstaff", 1), named("Rope", 50), named("Torch", 3)],
    currencies: { cp: 5, sp: 4, ep: 0, gp: 15, pp: 1 },
    spells: { race: null, class: null, background: null, item: [definedAs("Light")], feat: null },
    classSpells: [{ spells: [definedAs("Mage Hand")] }],
    feats: [{ definition: { id: 700, name: "Alert" } }],
    options: { race: [], class: [], background: null, item: null, feat: [] },
    customSpeeds: [],
    modifiers: {
      race: [],
      class: [{ ...modifierOf("set", "unarmored-armor-class", 900, null), statId: 5 }, modifierOf("proficiency", "dexterity-saving-throws", 900, null), modifierOf("proficiency", "acrobatics", 900, null)],
      background: [modifierOf("proficiency", "insight", 800, null)],
      item: [],
      feat: [modifierOf("bonus", "intelligence-score", 700, 1)],
      condition: [],
    },
    notes: { backstory: BACKSTORY_MARKER, allies: "Secondary Monk", enemies: "", organizations: "", otherHoldings: "", otherNotes: "", personalPossessions: "" },
    traits: { personalityTraits: TRAIT_MARKER },
  };
}
