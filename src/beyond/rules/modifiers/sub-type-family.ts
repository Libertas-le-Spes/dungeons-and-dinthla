import type { RuleModifier } from "../input/rule-modifier";

export class SubTypeFamily {
  constructor(
    private readonly names: readonly string[],
    private readonly stems: readonly string[],
  ) {}

  touches(modifier: RuleModifier): boolean {
    if (this.names.includes(modifier.subType)) return true;
    return this.stems.some((stem) => modifier.subType.includes(stem));
  }
}
