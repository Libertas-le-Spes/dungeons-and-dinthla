import { FEATURE_COUNT } from "../../shape/import-limits";
import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";

const CREATURE_TYPES = new Map<number, string>([[11, "Humanoid"]]);

const TYPE_TRAIT = "Creature Type";
const TAGS = /<[^>]*>/g;
const STATED_TYPE = /^You(?:'re| are) an? ([A-Za-z]+)\.?$/;

function statedTypeOf(trait: JsonReader): string | undefined {
  const definition = trait.readerAt("definition");
  if (definition.holdsNothingAt("name")) return undefined;
  if (definition.holdsNothingAt("description")) return undefined;
  if (definition.textAt("name") !== TYPE_TRAIT) return undefined;
  return STATED_TYPE.exec(definition.textAt("description").replace(TAGS, "").trim())?.at(1);
}

function typeFromTraits(race: JsonReader): string | undefined {
  for (const trait of race.listAtOrEmpty("racialTraits", FEATURE_COUNT)) {
    const stated = statedTypeOf(trait);
    if (stated !== undefined) return stated;
  }
  return undefined;
}

function typeFromId(race: JsonReader): string | undefined {
  const id = race.numberAt("creatureTypeId");
  if (id === null) return undefined;
  return CREATURE_TYPES.get(id);
}

export function creatureTypeOf(data: JsonReader): CleanLine | null {
  const race = data.readerAt("race");
  const found = typeFromId(race);
  if (found !== undefined) return CleanLine.of(found);
  const stated = typeFromTraits(race);
  if (stated === undefined) return null;
  return CleanLine.of(stated);
}
