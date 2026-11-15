import type { Campaign, CoinRecord } from "../../campaign/record/campaign";
import { COIN_ORDER, summariseFunds, withBase, type CoinCount, type FundsSummary } from "../page/funds-summary";
import { holderNameOf, sessionNumberIn } from "../items/item-groups";
import { ownLinkOf } from "../items/own-link";
import type { OwnSheet } from "./own-characters";

export interface MinePurseParts {
  campaign: Campaign;
  sheets: readonly OwnSheet[];
}

function lastSessionInSheet(sheet: OwnSheet): number {
  if (sheet.purse === null) return 0;
  if (sheet.importedSession === null) return Number.POSITIVE_INFINITY;
  return sheet.importedSession;
}

function sheetOf(record: CoinRecord, sheets: readonly OwnSheet[]): OwnSheet | undefined {
  const link = ownLinkOf({ links: record.links, ownNames: sheets.map((sheet) => sheet.name) });
  if (link === undefined) return undefined;
  const name = holderNameOf(link).toLowerCase();
  return sheets.find((sheet) => sheet.name.toLowerCase() === name);
}

function isAfterSheet(record: CoinRecord, sheets: readonly OwnSheet[]): boolean {
  const sheet = sheetOf(record, sheets);
  if (sheet === undefined) return false;
  return sessionNumberIn(record.source) > lastSessionInSheet(sheet);
}

function baseCoinsOf(sheets: readonly OwnSheet[]): CoinCount[] {
  const coins: CoinCount[] = [];
  for (const sheet of sheets) {
    if (sheet.purse === null) continue;
    for (const { coin, count } of sheet.purse) {
      const kind = COIN_ORDER.find((known) => known === coin);
      if (kind !== undefined && count !== null) coins.push({ kind, count });
    }
  }
  return coins;
}

export function minePurseOf({ campaign, sheets }: MinePurseParts): FundsSummary {
  const coins = campaign.coins.filter((record) => isAfterSheet(record, sheets));
  return withBase(summariseFunds({ ...campaign, coins }), baseCoinsOf(sheets));
}
