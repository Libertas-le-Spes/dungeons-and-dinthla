import type { CleanLine } from "../text/clean-line";
import type { AbilityScores } from "./ability-scores";
import type { ImportedClass } from "./imported-class";
import type { ImportedItem } from "./imported-item";
import type { ImportedNumber } from "./imported-number";
import type { Purse } from "./purse";
import type { Route } from "./route";

export interface ImportedCharacter {
  readonly route: Route;
  readonly name: CleanLine;
  readonly species: CleanLine;
  readonly classes: readonly ImportedClass[];
  readonly scores: AbilityScores;
  readonly numbers: readonly ImportedNumber[];
  readonly inventory: readonly ImportedItem[];
  readonly purse: Purse;
  readonly spells: readonly CleanLine[];
  readonly features: readonly CleanLine[];
}
