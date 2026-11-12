import type { Rule } from "../core/rule";
import { CASTER_CLASSES } from "./caster-classes";
import { PactSlotsRule } from "./pact-slots-rule";
import { SpellSlotsRule } from "./spell-slots-rule";
import { SpellcastingRule } from "./spellcasting-rule";

export const SPELL_RULES: readonly Rule[] = [...CASTER_CLASSES.map((caster) => new SpellcastingRule(caster)), new SpellSlotsRule(), new PactSlotsRule()];
