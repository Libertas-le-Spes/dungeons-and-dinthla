import type { AbilityScores } from "../../shape/ability-scores";
import { ABILITY_COUNT, SCORE } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import { ONLINE } from "../common/online-route";
import { abilityListedTwice } from "../common/reply-refusals";
import type { JsonReader } from "../json/json-reader";
import { numberValueOf } from "./number-value";

interface Ability {
  readonly id: number;
  readonly label: string;
}

export const ABILITIES: Record<keyof AbilityScores, Ability> = {
  strength: { id: 1, label: "Strength" },
  dexterity: { id: 2, label: "Dexterity" },
  constitution: { id: 3, label: "Constitution" },
  intelligence: { id: 4, label: "Intelligence" },
  wisdom: { id: 5, label: "Wisdom" },
  charisma: { id: 6, label: "Charisma" },
};

const NOT_STATED = "D&D Beyond states only the base score. The score is worked out from the base, the bonuses and the modifiers, in a later step.";
const UNEXPECTED = "D&D Beyond gave the scores set by hand in an unexpected form.";

class Overrides {
  private readonly found = new Map<number, number>();
  private unexpected = false;

  add(entry: JsonReader): void {
    const id = entry.numberAt("id");
    if (id === null || !Number.isInteger(id)) {
      this.unexpected = true;
      return;
    }
    if (entry.holdsNothingAt("value")) return;
    this.addValue(id, entry.numberAt("value"));
  }

  scoreOf(ability: Ability): WorkedValue<number> {
    if (this.unexpected) return new NotKnownValue(UNEXPECTED, ONLINE);
    const override = this.found.get(ability.id);
    if (override === undefined) return new NotKnownValue(NOT_STATED, ONLINE);
    return numberValueOf(override, SCORE, `${ability.label} set on D&D Beyond`);
  }

  private addValue(id: number, value: number | null): void {
    if (value === null) {
      this.unexpected = true;
      return;
    }
    if (this.found.has(id)) throw abilityListedTwice();
    this.found.set(id, value);
  }
}

function overridesIn(data: JsonReader): Overrides {
  const overrides = new Overrides();
  for (const entry of data.listAt("overrideStats", ABILITY_COUNT)) overrides.add(entry);
  return overrides;
}

export function scoresOf(data: JsonReader): AbilityScores {
  const overrides = overridesIn(data);
  return {
    strength: overrides.scoreOf(ABILITIES.strength),
    dexterity: overrides.scoreOf(ABILITIES.dexterity),
    constitution: overrides.scoreOf(ABILITIES.constitution),
    intelligence: overrides.scoreOf(ABILITIES.intelligence),
    wisdom: overrides.scoreOf(ABILITIES.wisdom),
    charisma: overrides.scoreOf(ABILITIES.charisma),
  };
}
