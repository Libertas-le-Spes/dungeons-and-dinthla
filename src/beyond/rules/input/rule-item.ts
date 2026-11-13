import type { CleanLine } from "../../text/clean-line";
import type { ArmourKind } from "./armour/armour-kind";

export interface RuleItem {
  readonly name: CleanLine;
  readonly equipped: boolean;
  readonly attuned: boolean;
  readonly needsAttunement: boolean;
  readonly armour: ArmourKind;
  readonly armourClass: number;
  readonly strengthRequired: number;
}
