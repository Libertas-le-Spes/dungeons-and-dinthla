import type { Rule } from "../core/rule";
import { CASTER_CLASSES } from "./casters/caster-classes";
import type { CasterClass } from "./casters/caster-class";
import { SpellcastingRule } from "./casting/spellcasting-rule";
import { UnbuiltCasterRule } from "./casting/unbuilt-caster-rule";
import { PactSlotsRule } from "./slots/pact-slots-rule";
import { SpellSlotsRule } from "./slots/spell-slots-rule";

function ruleOf(caster: CasterClass): Rule {
  return new SpellcastingRule(caster);
}

export const SPELL_RULES: readonly Rule[] = [...CASTER_CLASSES.map(ruleOf), new UnbuiltCasterRule(), new SpellSlotsRule(), new PactSlotsRule()];
