export interface ArmourKind {
  readonly label: string;
  readonly isBody: boolean;
  readonly isShield: boolean;
  dexterityPart(dexterityModifier: number): number;
}
