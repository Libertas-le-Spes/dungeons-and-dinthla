export class Ability {
  constructor(
    readonly short: string,
    readonly label: string,
  ) {}

  get subTypeName(): string {
    return this.label.toLowerCase();
  }

  get modifierName(): string {
    return `${this.short} modifier`;
  }

  get saveName(): string {
    return `${this.short} save`;
  }
}

export const STRENGTH = new Ability("STR", "Strength");
export const DEXTERITY = new Ability("DEX", "Dexterity");
export const CONSTITUTION = new Ability("CON", "Constitution");
export const INTELLIGENCE = new Ability("INT", "Intelligence");
export const WISDOM = new Ability("WIS", "Wisdom");
export const CHARISMA = new Ability("CHA", "Charisma");

export const ABILITIES: readonly Ability[] = [STRENGTH, DEXTERITY, CONSTITUTION, INTELLIGENCE, WISDOM, CHARISMA];
