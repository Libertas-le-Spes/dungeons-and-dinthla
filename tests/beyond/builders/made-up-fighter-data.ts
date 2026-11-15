import type { Node } from "./made-up-data";

function entryOf(name: string, id: number, armorTypeId: number, armorClass: number, strengthRequirement: number | null): Node {
  return { quantity: 1, equipped: true, isAttuned: false, definition: { id, name, canAttune: false, armorTypeId, armorClass, strengthRequirement } };
}

function modifierOf(subType: string, componentId: number): Node {
  return { type: "proficiency", subType, value: null, restriction: "", requiresAttunement: false, componentId };
}

export function madeUpFighterData(): Node {
  return {
    id: 5151,
    name: "Secondary Fighter",
    race: { fullName: "Dwarf", racialTraits: [], weightSpeeds: { normal: { walk: 30 }, override: null } },
    background: { definition: { id: 810, name: "Soldier" } },
    classes: [
      {
        level: 3,
        subclassDefinition: { name: "Champion", classFeatures: [] },
        definition: { name: "Fighter", hitDice: 10 },
        classFeatures: [{ definition: { id: 910, name: "Second Wind", requiredLevel: 1 } }],
      },
    ],
    stats: [15, 12, 14, 8, 10, 10].map((value, index) => ({ id: index + 1, value })),
    bonusStats: [1, 2, 3, 4, 5, 6].map((id) => ({ id, value: null })),
    overrideStats: [1, 2, 3, 4, 5, 6].map((id) => ({ id, value: null })),
    baseHitPoints: 28,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 5,
    temporaryHitPoints: 0,
    inventory: [entryOf("Chain Mail", 20, 3, 16, 13), entryOf("Shield", 21, 4, 2, null)],
    currencies: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
    spells: { race: null, class: null, background: null, item: null, feat: null },
    classSpells: [],
    feats: [{ definition: { id: 710, name: "Defense" } }],
    options: { race: [], class: [], background: null, item: null, feat: [] },
    customSpeeds: [],
    modifiers: {
      race: [],
      class: [modifierOf("strength-saving-throws", 910), modifierOf("constitution-saving-throws", 910), modifierOf("athletics", 910), modifierOf("perception", 910)],
      background: [],
      item: [],
      feat: [],
      condition: [],
    },
  };
}
