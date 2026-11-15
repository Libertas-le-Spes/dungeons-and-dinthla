import type { ImportedNumber } from "../../../shape/imported-number";
import { NotKnownValue } from "../../../shape/not-known-value";
import { MAX_HIT_POINTS_NAME } from "../../../rules/core/number-names";
import { ONLINE } from "../../common/online-route";
import type { JsonReader } from "../../json/json-reader";

const UNEXPECTED = "Hit points unreadable.";

export interface HitPointInputs {
  readonly base: number | null;
  readonly bonus: number | null;
  readonly override: number | null;
  readonly removed: number | null;
  readonly temporary: number | null;
  readonly doubts: readonly ImportedNumber[];
}

function bonusOf(data: JsonReader): number | null {
  if (data.isNullAt("bonusHitPoints")) return 0;
  return data.numberAt("bonusHitPoints");
}

export function hitPointInputsOf(data: JsonReader): HitPointInputs {
  const removed = data.numberAt("removedHitPoints");
  const temporary = data.numberAt("temporaryHitPoints");
  const override = data.numberAt("overrideHitPoints");
  if (!data.holdsNothingAt("overrideHitPoints") && override === null) {
    return { base: null, bonus: null, override: null, removed, temporary, doubts: [{ name: MAX_HIT_POINTS_NAME, value: new NotKnownValue(UNEXPECTED, ONLINE) }] };
  }
  return { base: data.numberAt("baseHitPoints"), bonus: bonusOf(data), override, removed, temporary, doubts: [] };
}
