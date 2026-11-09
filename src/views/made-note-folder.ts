import { charactersFolderOf, itemsFolderOf, placesFolderOf, questionsFolderOf, questsFolderOf } from "../campaign/campaign-folders";
import { readItemChange } from "../notes/item-change";
import { readLedgerEntry } from "../notes/ledger";
import { findPlaceLinks } from "../notes/link";
import { markerSpanOf, readMarker, type Marker } from "../notes/marker";

function holderOn(line: string): string | null {
  const change = readItemChange(line);
  if (change !== null) {
    if (change.holderLinked !== true || change.holder === undefined) return null;
    return change.holder;
  }
  const entry = readLedgerEntry(readMarker(line).body);
  if (entry === null || entry.type !== "item") return null;
  return entry.holder;
}

function ledgerFolderOf(campaignFolder: string, line: string, linkpath: string): string {
  if (holderOn(line) === linkpath) return charactersFolderOf(campaignFolder);
  return itemsFolderOf(campaignFolder);
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
