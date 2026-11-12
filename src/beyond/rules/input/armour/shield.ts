import type { ArmourKind } from "./armour-kind";

export class Shield implements ArmourKind {
  readonly label = "shield";
  readonly isBody = false;
  readonly isShield = true;

  dexterityPart(): number {
    return 0;
  }
}
