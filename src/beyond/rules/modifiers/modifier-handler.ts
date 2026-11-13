import type { RuleModifier } from "../input/rule-modifier";
import type { ModifierTally } from "./modifier-tally";

export interface ModifierHandler {
  handles(modifier: RuleModifier): boolean;
  applyTo(tally: ModifierTally, modifier: RuleModifier): void;
}
