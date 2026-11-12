import type { RuleModifier } from "../input/rule-modifier";
import type { ModifierHandler } from "./modifier-handler";
import { ModifierTally } from "./modifier-tally";
import type { SubTypeFamily } from "./sub-type-family";

function handlerFor(handlers: readonly ModifierHandler[], modifier: RuleModifier): ModifierHandler | undefined {
  return handlers.find((handler) => handler.handles(modifier));
}

function tallyOne(tally: ModifierTally, handlers: readonly ModifierHandler[], modifier: RuleModifier): void {
  const handler = handlerFor(handlers, modifier);
  if (handler === undefined) {
    tally.noteUnknown(modifier.subType.text);
    return;
  }
  handler.applyTo(tally, modifier);
}

export function tallyModifiers(modifiers: readonly RuleModifier[], family: SubTypeFamily, handlers: readonly ModifierHandler[]): ModifierTally {
  const tally = new ModifierTally();
  for (const modifier of modifiers) {
    if (family.touches(modifier)) tallyOne(tally, handlers, modifier);
  }
  return tally;
}
