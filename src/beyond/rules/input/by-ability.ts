import type { Ability } from "./ability";

export interface ByAbility<T> {
  get(ability: Ability): T | undefined;
}

export class AbilityTable<T> implements ByAbility<T> {
  private readonly found = new Map<string, T>();

  with(ability: Ability, value: T): AbilityTable<T> {
    this.found.set(ability.short, value);
    return this;
  }

  get(ability: Ability): T | undefined {
    return this.found.get(ability.short);
  }
}
