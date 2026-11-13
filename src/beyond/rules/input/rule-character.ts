import type { Route } from "../../shape/route";
import type { ByAbility } from "./by-ability";
import type { Edition } from "./edition";
import type { RuleClass } from "./rule-class";
import type { RuleItem } from "./rule-item";
import type { RuleModifier } from "./rule-modifier";

export interface RuleCharacter {
  readonly route: Route;
  readonly edition: Edition;
  readonly species: string;
  readonly classes: readonly RuleClass[];
  readonly baseScores: ByAbility<number>;
  readonly bonusScores: ByAbility<number>;
  readonly scoreOverrides: ByAbility<number>;
  readonly baseHitPoints: number | null;
  readonly bonusHitPoints: number | null;
  readonly overrideHitPoints: number | null;
  readonly removedHitPoints: number | null;
  readonly temporaryHitPoints: number | null;
  readonly walkingSpeed: number | null;
  readonly items: readonly RuleItem[];
  readonly modifiers: readonly RuleModifier[];
  readonly features: readonly string[];
}
