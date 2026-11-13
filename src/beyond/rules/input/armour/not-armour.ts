import type { ArmourKind } from "./armour-kind";

export class NotArmour implements ArmourKind {
  readonly label = "not armour";
  readonly isBody = false;
  readonly isShield = false;

  dexterityPart(): number {
    return 0;
  }
}
