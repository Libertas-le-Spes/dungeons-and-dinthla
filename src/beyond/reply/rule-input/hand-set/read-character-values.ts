import { CHARACTER_VALUE_COUNT } from "../../../shape/import-limits";
import type { ImportedNumber } from "../../../shape/imported-number";
import { numberInRange } from "../../../shape/number-in-range";
import { ARMOUR_CLASS, PASSIVE_SCORE } from "../../../shape/import-limits";
import type { NumberRange } from "../../../shape/number-range";
import { ARMOUR_CLASS_NAME } from "../../../rules/core/number-names";
import { PERCEPTION } from "../../../rules/proficiency/skills/skills";
import { ONLINE } from "../../common/online-route";
import { numericOf } from "../body/numeric-of";
import type { JsonReader } from "../../json/json-reader";
import { EveryNumberBlanket } from "./blanket";
import type { Blanket } from "./blanket";

interface KnownValue {
  readonly name: string;
  readonly label: string;
  readonly range: NumberRange;
}

const KNOWN_VALUES: ReadonlyMap<number, KnownValue> = new Map<number, KnownValue>([
  [1, { name: ARMOUR_CLASS_NAME, label: "Armor class", range: ARMOUR_CLASS }],
  [5, { name: PERCEPTION.passiveName, label: "Passive Perception", range: PASSIVE_SCORE }],
]);

export interface CharacterValues {
  readonly setByHand: readonly ImportedNumber[];
  readonly blankets: readonly Blanket[];
}

const NOT_READ = "A value is set by hand on D&D Beyond in a way I do not read yet, so I do not work numbers out. Type the numbers on your note to set them.";

function isPlain(entry: JsonReader): boolean {
  const others = ["valueId", "valueTypeId", "contextId", "contextTypeId"];
  return others.every((key) => entry.holdsNothingAt(key));
}

interface Found {
  readonly known: KnownValue;
  readonly value: number;
}

function foundIn(entry: JsonReader): Found | undefined {
  const value = entry.numberAt("value");
  if (value === null) return undefined;
  if (!isPlain(entry)) return undefined;
  const known = KNOWN_VALUES.get(numericOf(entry.numberAt("typeId")));
  if (known === undefined) return undefined;
  return { known, value };
}

function numberOf(found: Found): ImportedNumber {
  const working = `${found.known.label} set on D&D Beyond: ${found.value}`;
  return { name: found.known.name, value: numberInRange(found.value, found.known.range, working, ONLINE) };
}

function holdsAValue(entry: JsonReader): boolean {
  return !entry.holdsNothingAt("value");
}

function isFound(found: Found | undefined): found is Found {
  return found !== undefined;
}

export function characterValuesOf(data: JsonReader): CharacterValues {
  const founds = data.listAtOrEmpty("characterValues", CHARACTER_VALUE_COUNT).filter(holdsAValue).map(foundIn);
  const unread = founds.some((found) => found === undefined);
  return { setByHand: founds.filter(isFound).map(numberOf), blankets: unreadBlankets(unread) };
}

function unreadBlankets(unread: boolean): readonly Blanket[] {
  if (unread) return [new EveryNumberBlanket(NOT_READ)];
  return [];
}
