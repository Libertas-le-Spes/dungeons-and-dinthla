import type { Purse } from "../../shape/purse";
import type { SheetFields } from "../sheet-fields";
import { PURSE_FIELDS } from "../table/purse-rows";

export function purseOf(fields: SheetFields): Purse {
  return {
    platinum: PURSE_FIELDS.platinum.read(fields),
    gold: PURSE_FIELDS.gold.read(fields),
    electrum: PURSE_FIELDS.electrum.read(fields),
    silver: PURSE_FIELDS.silver.read(fields),
    copper: PURSE_FIELDS.copper.read(fields),
  };
}
