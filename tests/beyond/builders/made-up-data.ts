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

interface FeatureFields {
  readonly id: number;
  readonly name: string;
  readonly requiredLevel: number;
}

function featureOf(fields: FeatureFields): Node {
  return { definition: fields };
}

interface ModifierFields {
  readonly type: string;
  readonly subType: string;
  readonly componentId: number;
  readonly value: number | null;
}

function modifierOf(fields: ModifierFields): Node {
  return { ...fields, restriction: "", requiresAttunement: false };
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
        classFeatures: [featureOf({ id: 900, name: "Unarmored Defense", requiredLevel: 1 }), featureOf({ id: 901, name: "Unarmored Movement", requiredLevel: 2 })],
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
      class: [{ ...modifierOf({ type: "set", subType: "unarmored-armor-class", componentId: 900, value: null }), statId: 5 }, modifierOf({ type: "proficiency", subType: "dexterity-saving-throws", componentId: 900, value: null }), modifierOf({ type: "proficiency", subType: "acrobatics", componentId: 900, value: null })],
      background: [modifierOf({ type: "proficiency", subType: "insight", componentId: 800, value: null })],
      item: [],
      feat: [modifierOf({ type: "bonus", subType: "intelligence-score", componentId: 700, value: 1 })],
      condition: [],
    },
    notes: { backstory: BACKSTORY_MARKER, allies: "Secondary Monk", enemies: "", organizations: "", otherHoldings: "", otherNotes: "", personalPossessions: "" },
    traits: { personalityTraits: TRAIT_MARKER },
  };
}
