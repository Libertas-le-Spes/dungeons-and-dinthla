import type { Ability } from "../../input/ability";
import type { RuleClass } from "../../input/rule-class";
import type { CasterKind } from "./caster-kind";

export class CasterClass {
  constructor(
    readonly className: string,
    readonly subclass: string,
    readonly ability: Ability,
    readonly kind: CasterKind,
  ) {}

  get label(): string {
    if (this.subclass === "") return this.className;
    return this.subclass;
  }

  matches(ruleClass: RuleClass): boolean {
    if (ruleClass.name !== this.className) return false;
    if (this.subclass === "") return true;
    return ruleClass.subclass === this.subclass;
  }
}
