import type { Campaign, CoinRecord } from "../../campaign/campaign";
import { copperOf, type CoinKind } from "../../notes/ledger";

export interface CoinCount {
  kind: CoinKind;
  count: number;
}

export interface LedgerLine {
  record: CoinRecord;
  balance: number;
}

export interface FundsSummary {
  purse: number;
  totalIn: number;
  totalOut: number;
  coinCounts: CoinCount[];
  ledger: LedgerLine[];
}

const COIN_ORDER: CoinKind[] = ["pp", "gp", "ep", "sp", "cp"];

function coinCountsOf(records: CoinRecord[]): CoinCount[] {
  const counts = new Map<CoinKind, number>(COIN_ORDER.map((kind) => [kind, 0]));
  for (const record of records) {
    for (const amount of record.entry.coins) {
      let count = amount.count;
      if (amount.moneyOut) count = -count;
      counts.set(amount.kind, counts.get(amount.kind)! + count);
    }
  }
  return COIN_ORDER.map((kind) => ({ kind, count: counts.get(kind)! })).filter((coin) => coin.count !== 0);
}

export function summariseFunds(campaign: Campaign): FundsSummary {
  let balance = 0;
  let totalIn = 0;
  let totalOut = 0;
  const ledger: LedgerLine[] = [];
  for (const record of campaign.coins) {
    balance += record.entry.copper;
    for (const amount of record.entry.coins) {
      const copper = copperOf(amount);
      if (amount.moneyOut) totalOut -= copper;
      else totalIn += copper;
    }
    ledger.push({ record, balance });
  }
  return { purse: balance, totalIn, totalOut, coinCounts: coinCountsOf(campaign.coins), ledger: ledger.reverse() };
}
