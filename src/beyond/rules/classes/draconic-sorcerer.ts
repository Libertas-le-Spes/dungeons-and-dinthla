import type { RuleClass } from "../input/rule-class";

export function isDraconicSorcerer(ruleClass: RuleClass): boolean {
  if (ruleClass.name !== "Sorcerer") return false;
  return ruleClass.subclass.startsWith("Draconic");
}

export function draconicSorcerers(classes: readonly RuleClass[]): readonly RuleClass[] {
  return classes.filter(isDraconicSorcerer);
}
