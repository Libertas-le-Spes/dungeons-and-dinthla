import type { ImportedItem } from "../../shape/imported-item";
import { INVENTORY_COUNT, ITEM_COUNT } from "../../shape/import-limits";
import type { JsonReader } from "../json/json-reader";
import { definitionNameOf } from "./definition-name";
import { numberValueOf } from "./number-value";

function itemOf(entry: JsonReader): ImportedItem {
  return { name: definitionNameOf(entry), count: numberValueOf(entry.numberAt("quantity"), ITEM_COUNT, "Quantity") };
}

export function inventoryOf(data: JsonReader): readonly ImportedItem[] {
  return data.listAt("inventory", INVENTORY_COUNT).map(itemOf);
}
