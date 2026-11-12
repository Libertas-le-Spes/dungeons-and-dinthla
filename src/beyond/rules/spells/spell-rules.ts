import type { Rule } from "../core/rule";
import { CASTER_CLASSES } from "./casters/caster-classes";
import { PactSlotsRule } from "./slots/pact-slots-rule";
import { SpellSlotsRule } from "./slots/spell-slots-rule";
import { SpellcastingRule } from "./casting/spellcasting-rule";

export const SPELL_RULES: readonly Rule[] = [...CASTER_CLASSES.map((caster) => new SpellcastingRule(caster)), new SpellSlotsRule(), new PactSlotsRule()];
