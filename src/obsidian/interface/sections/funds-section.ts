import { campaignOfItem } from "../../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../../campaign/reading/campaign-store";
import { noteNameOf } from "../../../campaign/paths/note-name";
import type { NoteTexts } from "../../../campaign/reading/note-texts";
import { FundsPage, type ShownItem } from "../../../funds/page/funds-page";
import { OwnCharacters, type OwnCharacterNotes } from "../../../funds/purses/own-characters";
import { ItemPanel, type OpenItem } from "../../../funds/item-notes/item-panel";
import type { CoinSide } from "../../../funds/coins/coin-sides";
import type { OpenLedgerEntry } from "../../../funds/coins/open-ledger-entry";
import type { LinkActions } from "../../../interface/sections/link-actions";
import type { MakePage, ShowPage } from "../view/campaign-pages";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";
import { PageFrame } from "../../views/frames/page-frame";
import { PLAIN_KIT } from "../../views/mount/mount-kit";

export interface FundsNeeds {
  store: CampaignStore;
  texts: NoteTexts;
  actions: LinkActions;
  noteExists(name: string, sourcePath: string): boolean;
  addCoin(side: CoinSide, returnFocus: () => void): void;
  openLedgerEntry: OpenLedgerEntry;
  openItem: OpenItem;
  campaignFolders(): string[];
  ownCharacterNotes: OwnCharacterNotes;
}

function itemPanelOf(path: string, needs: FundsNeeds, show: ShowPage, syntax: PropertiesSyntax): ItemPanel {
  return new ItemPanel(path, {
    store: needs.store,
    texts: needs.texts,
    opener: needs.actions,
    openItem: needs.openItem,
    syntax,
    editNote: (notePath) => show({ page: "note", path: notePath }),
    close: () => show({ page: "funds", path: null }),
  });
}

function shownItemOf(path: string | null, needs: FundsNeeds, show: ShowPage, syntax: PropertiesSyntax): ShownItem | null {
  if (path === null || campaignOfItem(path, needs.campaignFolders()) === null) return null;
  return { name: noteNameOf(path), panel: itemPanelOf(path, needs, show, syntax) };
}

export function fundsSection(needs: FundsNeeds, syntax: PropertiesSyntax): MakePage {
  return (contentEl, show, path) =>
    new PageFrame(contentEl, new FundsPage({
      store: needs.store,
      opener: needs.actions,
      noteExists: (name, sourcePath) => needs.noteExists(name, sourcePath),
      addCoin: (side, returnFocus) => needs.addCoin(side, returnFocus),
      openLedgerEntry: needs.openLedgerEntry,
      openItem: needs.openItem,
      shownItem: shownItemOf(path, needs, show, syntax),
      ownCharacters: new OwnCharacters({ store: needs.store, notes: needs.ownCharacterNotes }, syntax),
    }), PLAIN_KIT);
}
