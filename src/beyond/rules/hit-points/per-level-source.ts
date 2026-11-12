import type { WorkedValue } from "../../shape/worked-value";
import type { RuleCharacter } from "../input/rule-character";

export interface PerLevelSource {
  readonly sourceName: string;
  addition(character: RuleCharacter, totalLevel: number): WorkedValue<number> | null;
}
