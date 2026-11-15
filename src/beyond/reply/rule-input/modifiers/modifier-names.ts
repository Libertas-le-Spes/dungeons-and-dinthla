import { FEATURE_COUNT } from "../../../shape/import-limits";
import type { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { classFeaturesOf } from "../features/class-features";
import { namedIdsOf } from "../features/named-ids";

export type ModifierNames = ReadonlyMap<number, CleanLine>;

export function classNamesOf(data: JsonReader): ModifierNames {
  const features = data.listAt("classes", FEATURE_COUNT).flatMap(classFeaturesOf);
  return namedIdsOf(features);
}

export function raceNamesOf(data: JsonReader): ModifierNames {
  return namedIdsOf(data.readerAt("race").listAtOrEmpty("racialTraits", FEATURE_COUNT));
}

export function featNamesOf(data: JsonReader): ModifierNames {
  return namedIdsOf(data.listAt("feats", FEATURE_COUNT));
}

export function backgroundNamesOf(data: JsonReader): ModifierNames {
  if (data.holdsNothingAt("background")) return new Map();
  const background = data.readerAt("background");
  if (background.holdsNothingAt("definition")) return new Map();
  return namedIdsOf([background]);
}
