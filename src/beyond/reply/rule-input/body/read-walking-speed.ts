import type { ImportedNumber } from "../../../shape/imported-number";
import { CUSTOM_SPEED_COUNT } from "../../../shape/import-limits";
import { NotKnownValue } from "../../../shape/not-known-value";
import { SPEED_NAME } from "../../../rules/core/number-names";
import { ONLINE } from "../../common/online-route";
import type { JsonReader } from "../../json/json-reader";

const BY_HAND = "A speed is set by hand on D&D Beyond, and I do not read it yet. Type the speed on your note to set it.";

export interface SpeedInputs {
  readonly walking: number | null;
  readonly doubts: readonly ImportedNumber[];
}

function walkingOf(data: JsonReader): number | null {
  const race = data.readerAt("race");
  if (race.holdsNothingAt("weightSpeeds")) return null;
  const speeds = race.readerAt("weightSpeeds");
  if (speeds.holdsNothingAt("normal")) return null;
  return speeds.readerAt("normal").numberAt("walk");
}

function isSetByHand(data: JsonReader): boolean {
  if (data.listAtOrEmpty("customSpeeds", CUSTOM_SPEED_COUNT).length > 0) return true;
  const race = data.readerAt("race");
  if (race.holdsNothingAt("weightSpeeds")) return false;
  return !race.readerAt("weightSpeeds").holdsNothingAt("override");
}

export function speedInputsOf(data: JsonReader): SpeedInputs {
  const walking = walkingOf(data);
  if (isSetByHand(data)) return { walking, doubts: [{ name: SPEED_NAME, value: new NotKnownValue(BY_HAND, ONLINE) }] };
  return { walking, doubts: [] };
}
