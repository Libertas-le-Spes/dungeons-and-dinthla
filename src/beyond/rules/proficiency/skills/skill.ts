import type { Ability } from "../../input/ability";

export class Skill {
  constructor(
    readonly name: string,
    readonly ability: Ability,
    readonly subType: string,
  ) {}

  get passiveName(): string {
    return `Passive ${this.name}`;
  }
}
