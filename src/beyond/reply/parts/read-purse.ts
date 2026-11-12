import { COIN_COUNT } from "../../shape/import-limits";
import type { Purse } from "../../shape/purse";
import type { WorkedValue } from "../../shape/worked-value";
import type { JsonReader } from "../json/json-reader";
import { numberValueOf } from "./number-value";

function coinOf(coins: JsonReader, key: string, label: string): WorkedValue<number> {
  return numberValueOf(coins.numberAt(key), COIN_COUNT, label);
}

export function purseOf(data: JsonReader): Purse {
  const coins = data.readerAt("currencies");
  return {
    platinum: coinOf(coins, "pp", "Platinum"),
    gold: coinOf(coins, "gp", "Gold"),
    electrum: coinOf(coins, "ep", "Electrum"),
    silver: coinOf(coins, "sp", "Silver"),
    copper: coinOf(coins, "cp", "Copper"),
  };
}
