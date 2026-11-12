import { COIN_COUNT } from "../../shape/import-limits";
import type { Purse } from "../../shape/purse";
import { WHOLE } from "../numbers/number-texts";
import { PrintedNumber } from "../numbers/printed-number";

export const PURSE_FIELDS: Record<keyof Purse, PrintedNumber> = {
  platinum: new PrintedNumber("PP", COIN_COUNT, WHOLE),
  gold: new PrintedNumber("GP", COIN_COUNT, WHOLE),
  electrum: new PrintedNumber("EP", COIN_COUNT, WHOLE),
  silver: new PrintedNumber("SP", COIN_COUNT, WHOLE),
  copper: new PrintedNumber("CP", COIN_COUNT, WHOLE),
};
