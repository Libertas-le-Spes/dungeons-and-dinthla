import { campaignOfItem } from "../../campaign/paths/campaign-folders";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { noteNameOf } from "../../campaign/paths/note-name";
import type { NoteTexts } from "../../campaign/reading/note-texts";
import { FundsPage, type PursesBeside, type ShownItem } from "../../funds/page/funds-page";
import { OwnPursePanel } from "../../funds/purses/own-purse-panel";
import type { OwnPurseNotes } from "../../funds/purses/own-purses";
import { ItemPanel, type OpenItem } from "../../funds/item-notes/item-panel";
import type { OpenLedgerEntry } from "../../funds/coins/open-ledger-entry";
import type { LinkActions } from "../../views/lists/linked-text";
import type { MakePage, ShowPage } from "../view/campaign-pages";

export interface FundsNeeds {
  store: CampaignStore;
  texts: NoteTexts;
  actions: LinkActions;
  noteExists(name: string, sourcePath: string): boolean;
  addCoin(returnFocus: () => void): void;
  openLedgerEntry: OpenLedgerEntry;
  openItem: OpenItem;
  campaignFolders(): string[];
  ownPurseNotes: OwnPurseNotes;
}

class OwnPurses implements PursesBeside {
  constructor(private readonly needs: FundsNeeds) {}

  panel(panelEl: HTMLElement): OwnPursePanel {
    return new OwnPursePanel(panelEl, this.needs.store, this.needs.ownPurseNotes);
  }
}

function itemPanelOf(panelEl: HTMLElement, path: string, needs: FundsNeeds, show: ShowPage): ItemPanel {
  return new ItemPanel(panelEl, path, {
    store: needs.store,
    texts: needs.texts,
    actions: needs.actions,
    openItem: needs.openItem,
    editNote: (notePath) => show({ page: "note", path: notePath }),
    close: () => show({ page: "funds", path: null }),
  });
}

function shownItemOf(path: string | null, needs: FundsNeeds, show: ShowPage): ShownItem | null {
  if (path === null || campaignOfItem(path, needs.campaignFolders()) === null) return null;
  return { name: noteNameOf(path), panel: (panelEl) => itemPanelOf(panelEl, path, needs, show) };
}

export function fundsSection(needs: FundsNeeds): MakePage {
  return (contentEl, show, path) =>
    new FundsPage(
      contentEl,
      needs.store,
      needs.actions,
      (name, sourcePath) => needs.noteExists(name, sourcePath),
      (returnFocus) => needs.addCoin(returnFocus),
      needs.openLedgerEntry,
      needs.openItem,
      shownItemOf(path, needs, show),
      new OwnPurses(needs),
    );
}
