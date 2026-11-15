import { CHARISMA, CONSTITUTION, DEXTERITY, INTELLIGENCE, STRENGTH, WISDOM } from "../../../rules/input/ability";
import type { Ability } from "../../../rules/input/ability";

export interface AbilityId {
  readonly id: number;
  readonly ability: Ability;
}

export const ABILITY_IDS: readonly AbilityId[] = [
  { id: 1, ability: STRENGTH },
  { id: 2, ability: DEXTERITY },
  { id: 3, ability: CONSTITUTION },
  { id: 4, ability: INTELLIGENCE },
  { id: 5, ability: WISDOM },
  { id: 6, ability: CHARISMA },
];
