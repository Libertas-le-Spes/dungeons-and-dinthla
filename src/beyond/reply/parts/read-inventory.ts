import type { ImportedItem } from "../../shape/imported-item";
import { INVENTORY_COUNT, ITEM_COUNT } from "../../shape/import-limits";
import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";
import { definitionNameOf } from "./definition-name";
import { numberValueOf } from "./number-value";

function itemOf(entry: JsonReader): ImportedItem {
  return { name: definitionNameOf(entry), count: numberValueOf(entry.numberAt("quantity"), ITEM_COUNT, "Quantity") };
}

function customItemOf(entry: JsonReader): ImportedItem {
  return { name: CleanLine.of(entry.textAt("name")), count: numberValueOf(entry.numberAt("quantity"), ITEM_COUNT, "Quantity") };
}

export function inventoryOf(data: JsonReader): readonly ImportedItem[] {
  const listed = data.listAt("inventory", INVENTORY_COUNT).map(itemOf);
  const custom = data.listAtOrEmpty("customItems", INVENTORY_COUNT).map(customItemOf);
  return [...listed, ...custom];
}
