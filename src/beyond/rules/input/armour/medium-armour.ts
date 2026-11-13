import type { ArmourKind } from "./armour-kind";

const MOST_DEXTERITY = 2;

export class MediumArmour implements ArmourKind {
  readonly label = "medium armour";
  readonly isBody = true;
  readonly isShield = false;

  dexterityPart(dexterityModifier: number): number {
    return Math.min(dexterityModifier, MOST_DEXTERITY);
  }
}
