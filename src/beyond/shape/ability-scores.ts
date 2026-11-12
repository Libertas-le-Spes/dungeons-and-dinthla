import type { WorkedValue } from "./worked-value";

export interface AbilityScores {
  readonly strength: WorkedValue<number>;
  readonly dexterity: WorkedValue<number>;
  readonly constitution: WorkedValue<number>;
  readonly intelligence: WorkedValue<number>;
  readonly wisdom: WorkedValue<number>;
  readonly charisma: WorkedValue<number>;
}
