import type { NotKnownValue } from "../../shape/not-known-value";
import type { Edition } from "../input/edition";
import type { RuleCharacter } from "../input/rule-character";
import type { SubTypeFamily } from "../modifiers/sub-type-family";
import { FeatureTouching, MAY_CHANGE_IT } from "./feature-touching";
import { sameName } from "./same-name";
import { notKnown } from "./worked";
import { shortList } from "./working-text";

export interface ModelledTouchingOptions {
  readonly names: readonly string[];
  readonly family: SubTypeFamily;
  readonly modelled: readonly string[];
  readonly noEffectIn: ReadonlyMap<string, Edition>;
}

export class ModelledTouching {
  private readonly touching: FeatureTouching;

  constructor(private readonly options: ModelledTouchingOptions) {
    this.touching = new FeatureTouching(options.names, MAY_CHANGE_IT);
  }

  named(character: RuleCharacter): readonly string[] {
    return this.touching.named(character).filter((name) => this.isUnsettled(character, name));
  }

  unknownFor(character: RuleCharacter): NotKnownValue<number> | null {
    const found = this.named(character);
    if (found.length === 0) return null;
    return notKnown(`${shortList(found)} ${MAY_CHANGE_IT}.`, character.route);
  }

  private isUnsettled(character: RuleCharacter, name: string): boolean {
    if (this.hasNoEffectIn(character, name)) return false;
    return !this.isAccountedFor(character, name);
  }

  private hasNoEffectIn(character: RuleCharacter, name: string): boolean {
    for (const [feature, edition] of this.options.noEffectIn) {
      if (sameName(feature, name) && edition === character.edition) return true;
    }
    return false;
  }

  private isAccountedFor(character: RuleCharacter, name: string): boolean {
    if (!this.options.modelled.some((modelled) => sameName(modelled, name))) return false;
    return character.modifiers.some((modifier) => {
      if (!modifier.inForce) return false;
      if (modifier.restriction.trim() !== "") return false;
      if (!sameName(modifier.sourceName.text, name)) return false;
      return this.options.family.touches(modifier);
    });
  }
}
