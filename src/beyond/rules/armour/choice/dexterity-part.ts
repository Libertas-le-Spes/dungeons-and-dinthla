export interface DexterityPart {
  dexterityPart(dexterityModifier: number): number;
}

export class FullDexterity implements DexterityPart {
  dexterityPart(dexterityModifier: number): number {
    return dexterityModifier;
  }
}
