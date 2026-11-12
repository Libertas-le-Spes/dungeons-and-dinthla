import type { RuleModifier } from "../input/rule-modifier";

function holdsStem(subType: string, stem: string): boolean {
  return subType.includes(stem);
}

export class SubTypeFamily {
  constructor(
    private readonly names: readonly string[],
    private readonly stems: readonly string[],
  ) {}

  touches(modifier: RuleModifier): boolean {
    const subType = modifier.subType.text;
    if (this.names.includes(subType)) return true;
    return this.stems.some((stem) => holdsStem(subType, stem));
  }
}
