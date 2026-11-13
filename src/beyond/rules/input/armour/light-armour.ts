import type { ArmourKind } from "./armour-kind";

export class LightArmour implements ArmourKind {
  readonly label = "light armour";
  readonly isBody = true;
  readonly isShield = false;

  dexterityPart(dexterityModifier: number): number {
    return dexterityModifier;
  }
}
