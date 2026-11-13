import type { ArmourKind } from "./armour-kind";

export class HeavyArmour implements ArmourKind {
  readonly label = "heavy armour";
  readonly isBody = true;
  readonly isShield = false;

  dexterityPart(): number {
    return 0;
  }
}
