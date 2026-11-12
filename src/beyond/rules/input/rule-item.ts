import type { ArmourKind } from "./armour/armour-kind";

export interface RuleItem {
  readonly name: string;
  readonly equipped: boolean;
  readonly attuned: boolean;
  readonly needsAttunement: boolean;
  readonly armour: ArmourKind;
  readonly armourClass: number;
  readonly strengthRequired: number;
}
