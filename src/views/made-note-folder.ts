import { charactersFolderOf, fundsFolderOf, itemsFolderOf, placesFolderOf, questionsFolderOf, questsFolderOf } from "../campaign/campaign-folders";
import { readItemChange, type ItemChange } from "../notes/item-change";
import { readLedgerEntry, type LedgerEntry } from "../notes/ledger";
import { findPlaceLinks } from "../notes/link";
import { markerSpanOf, readMarker, type Marker } from "../notes/marker";

function itemChangeFolderOf(campaignFolder: string, change: ItemChange, linkpath: string): string {
  if (change.buyer === linkpath) return fundsFolderOf(campaignFolder);
  if (change.holderLinked === true && change.holder === linkpath) return charactersFolderOf(campaignFolder);
  return itemsFolderOf(campaignFolder);
}

function ledgerEntryFolderOf(campaignFolder: string, entry: LedgerEntry | null, linkpath: string): string {
  if (entry === null) return itemsFolderOf(campaignFolder);
  if (entry.type === "coin") return fundsFolderOf(campaignFolder);
  if (entry.holder === linkpath) return charactersFolderOf(campaignFolder);
  return itemsFolderOf(campaignFolder);
}

function ledgerFolderOf(campaignFolder: string, line: string, linkpath: string): string {
  const change = readItemChange(line);
  if (change !== null) return itemChangeFolderOf(campaignFolder, change, linkpath);
  return ledgerEntryFolderOf(campaignFolder, readLedgerEntry(readMarker(line).body), linkpath);
}

const FOLDER_OF: Record<Marker, (campaignFolder: string, line: string, linkpath: string) => string> = {
  question: questionsFolderOf,
  quest: questsFolderOf,
  ledger: ledgerFolderOf,
};

export function markedFolderOf(campaignFolder: string, line: string, linkpath: string): string | null {
  const span = markerSpanOf(line);
  if (span !== null) return FOLDER_OF[span.marker](campaignFolder, line, linkpath);
  if (findPlaceLinks(line).includes(linkpath)) return placesFolderOf(campaignFolder);
  return null;
}
