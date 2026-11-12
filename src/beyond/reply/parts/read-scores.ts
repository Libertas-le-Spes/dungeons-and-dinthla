import type { AbilityScores } from "../../shape/ability-scores";
import { ABILITY_COUNT, SCORE } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import type { JsonReader } from "../json/json-reader";
import { ONLINE } from "../online-route";
import { abilityListedTwice } from "../reply-refusals";
import { numberValueOf } from "./number-value";

interface Ability {
  readonly id: number;
  readonly label: string;
}

const STRENGTH: Ability = { id: 1, label: "Strength" };
const DEXTERITY: Ability = { id: 2, label: "Dexterity" };
const CONSTITUTION: Ability = { id: 3, label: "Constitution" };
const INTELLIGENCE: Ability = { id: 4, label: "Intelligence" };
const WISDOM: Ability = { id: 5, label: "Wisdom" };
const CHARISMA: Ability = { id: 6, label: "Charisma" };

const NOT_STATED = "D&D Beyond states only the base score. The score is worked out from the base, the bonuses and the modifiers, in a later step.";

function addOverride(found: Map<number, number>, entry: JsonReader): void {
  const id = entry.numberAt("id");
  const value = entry.numberAt("value");
  if (id === null || value === null) return;
  if (found.has(id)) throw abilityListedTwice();
  found.set(id, value);
}

function overridesIn(data: JsonReader): ReadonlyMap<number, number> {
  const found = new Map<number, number>();
  for (const entry of data.listAt("overrideStats", ABILITY_COUNT)) addOverride(found, entry);
  return found;
}

function scoreOf(overrides: ReadonlyMap<number, number>, ability: Ability): WorkedValue<number> {
  const override = overrides.get(ability.id);
  if (override === undefined) return new NotKnownValue(NOT_STATED, ONLINE);
  return numberValueOf(override, SCORE, `${ability.label} set on D&D Beyond`);
}

export function scoresOf(data: JsonReader): AbilityScores {
  const overrides = overridesIn(data);
  return {
    strength: scoreOf(overrides, STRENGTH),
    dexterity: scoreOf(overrides, DEXTERITY),
    constitution: scoreOf(overrides, CONSTITUTION),
    intelligence: scoreOf(overrides, INTELLIGENCE),
    wisdom: scoreOf(overrides, WISDOM),
    charisma: scoreOf(overrides, CHARISMA),
  };
}
