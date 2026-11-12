import { MAX_HIT_POINTS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import { ONLINE } from "../common/online-route";
import type { JsonReader } from "../json/json-reader";
import { numberValueOf } from "./number-value";

const NOT_STATED = "D&D Beyond does not state maximum hit points. They are worked out from the dice total and the constitution bonus, in a later step.";
const UNEXPECTED = "D&D Beyond gave the hit points set by hand in an unexpected form.";

export function hitPointsOf(data: JsonReader): WorkedValue<number> {
  if (data.holdsNothingAt("overrideHitPoints")) return new NotKnownValue(NOT_STATED, ONLINE);
  const override = data.numberAt("overrideHitPoints");
  if (override === null) return new NotKnownValue(UNEXPECTED, ONLINE);
  return numberValueOf(override, MAX_HIT_POINTS, "Hit points set on D&D Beyond");
}
