import { FEATURE_COUNT } from "../../../shape/import-limits";
import type { JsonReader } from "../../json/json-reader";
import { definitionNameOf } from "../../parts/definition-name";
import { numericOf } from "../body/numeric-of";
import { classFeaturesOf } from "./class-features";

const OPTION_SOURCES = ["race", "class", "background", "item", "feat"];

function nameOf(entry: JsonReader): string {
  return definitionNameOf(entry).text;
}

function reachedFeatures(classEntry: JsonReader): readonly JsonReader[] {
  const level = numericOf(classEntry.numberAt("level"));
  return classFeaturesOf(classEntry).filter((feature) => isReached(feature, level));
}

function isReached(feature: JsonReader, level: number): boolean {
  return numericOf(feature.readerAt("definition").numberAt("requiredLevel")) <= level;
}

function classFeatureNames(data: JsonReader): string[] {
  const found: string[] = [];
  for (const classEntry of data.listAt("classes", FEATURE_COUNT)) found.push(...reachedFeatures(classEntry).map(nameOf));
  return found;
}

function optionNames(data: JsonReader): string[] {
  const options = data.readerAt("options");
  const found: string[] = [];
  for (const source of OPTION_SOURCES) found.push(...options.listAtOrEmpty(source, FEATURE_COUNT).map(nameOf));
  return found;
}

export function ruleFeaturesOf(data: JsonReader): readonly string[] {
  const feats = data.listAt("feats", FEATURE_COUNT).map(nameOf);
  const traits = data.readerAt("race").listAtOrEmpty("racialTraits", FEATURE_COUNT).map(nameOf);
  return [...feats, ...traits, ...classFeatureNames(data), ...optionNames(data)];
}
