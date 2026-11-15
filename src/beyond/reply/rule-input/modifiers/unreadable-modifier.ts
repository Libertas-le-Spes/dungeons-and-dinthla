import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";

export function unreadableModifierOf(subType: CleanLine, sourceName: CleanLine): RuleModifier {
  return { type: "unreadable", subType, value: null, restriction: "", sourceName, inForce: true };
}
