import { numberedNames } from "./numbered-names";

export const SPELL_NAME_FIELDS: readonly string[] = [...numberedNames("spellName", 0, 4), ...numberedNames("SpellName", 8, 49)];
