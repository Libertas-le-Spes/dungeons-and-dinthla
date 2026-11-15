import type { ImportedNumber } from "../../../shape/imported-number";
import { ABILITY_COUNT, BASE_SCORE_COUNT, BONUS_SCORE_COUNT } from "../../../shape/import-limits";
import { NotKnownValue } from "../../../shape/not-known-value";
import { AbilityTable } from "../../../rules/input/by-ability";
import type { ByAbility } from "../../../rules/input/by-ability";
import { ONLINE } from "../../common/online-route";
import type { JsonReader } from "../../json/json-reader";
import { ABILITY_IDS } from "./ability-ids";
import type { AbilityId } from "./ability-ids";
import { ScoreEntries } from "./score-entries";

const UNEXPECTED = "D&D Beyond gave the scores, their bonuses or the scores set by hand in an unexpected form.";

export interface ScoreInputs {
  readonly base: ByAbility<number>;
  readonly bonus: ByAbility<number>;
  readonly overrides: ByAbility<number>;
  readonly doubts: readonly ImportedNumber[];
}

function doubtOf(id: AbilityId): ImportedNumber {
  return { name: id.ability.short, value: new NotKnownValue(UNEXPECTED, ONLINE) };
}

export function scoreInputsOf(data: JsonReader): ScoreInputs {
  const base = ScoreEntries.of(data, "stats", BASE_SCORE_COUNT);
  const bonus = ScoreEntries.of(data, "bonusStats", BONUS_SCORE_COUNT);
  const overrides = ScoreEntries.of(data, "overrideStats", ABILITY_COUNT);
  if (base.isUnexpected || bonus.isUnexpected || overrides.isUnexpected) {
    return { base: new AbilityTable<number>(), bonus: new AbilityTable<number>(), overrides: new AbilityTable<number>(), doubts: ABILITY_IDS.map(doubtOf) };
  }
  return { base: base.valued(), bonus: bonus.valuedWithEmptyAsZero(), overrides: overrides.valued(), doubts: [] };
}
