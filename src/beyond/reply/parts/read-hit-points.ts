import { HIT_POINTS } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { WorkedValue } from "../../shape/worked-value";
import type { JsonReader } from "../json/json-reader";
import { ONLINE } from "../online-route";
import { numberValueOf } from "./number-value";

const NOT_STATED = "D&D Beyond does not state maximum hit points. They are worked out from the dice total and the constitution bonus, in a later step.";

export function hitPointsOf(data: JsonReader): WorkedValue<number> {
  const override = data.numberAt("overrideHitPoints");
  if (override === null) return new NotKnownValue(NOT_STATED, ONLINE);
  return numberValueOf(override, HIT_POINTS, "Hit points set on D&D Beyond");
}
