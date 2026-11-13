import type { Ability } from "../../input/ability";
import type { DexterityPart } from "./dexterity-part";

export interface Formula {
  readonly baseText: string;
  readonly baseAmount: number;
  readonly dexterity: DexterityPart;
  readonly others: readonly Ability[];
  readonly reason: string;
}
