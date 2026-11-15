import { MODIFIER_COUNT } from "../../shape/import-limits";
import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";

const SIZES = new Map<number, string>([
  [2, "Tiny"],
  [3, "Small"],
  [4, "Medium"],
  [5, "Large"],
  [6, "Huge"],
  [7, "Gargantuan"],
]);

const SIZE_MODIFIER = "size";

function sizeNamed(subType: string): string | undefined {
  return [...SIZES.values()].find((name) => name.toLowerCase() === subType.trim().toLowerCase());
}

function isSizeModifier(entry: JsonReader): boolean {
  if (entry.holdsNothingAt("type")) return false;
  if (entry.holdsNothingAt("subType")) return false;
  return entry.textAt("type") === SIZE_MODIFIER;
}

function chosenSizesOf(data: JsonReader): string[] {
  const entries = data.readerAt("modifiers").listAt("race", MODIFIER_COUNT).filter(isSizeModifier);
  const chosen = new Set<string>();
  for (const entry of entries) {
    const size = sizeNamed(entry.textAt("subType"));
    if (size !== undefined) chosen.add(size);
  }
  return [...chosen];
}

function sizeIdNameOf(data: JsonReader): string | undefined {
  const id = data.readerAt("race").numberAt("sizeId");
  if (id === null) return undefined;
  return SIZES.get(id);
}

export function sizeOf(data: JsonReader): CleanLine | null {
  const chosen = chosenSizesOf(data);
  if (chosen.length > 1) return null;
  const [only] = chosen;
  if (only !== undefined) return CleanLine.of(only);
  const named = sizeIdNameOf(data);
  if (named === undefined) return null;
  return CleanLine.of(named);
}
