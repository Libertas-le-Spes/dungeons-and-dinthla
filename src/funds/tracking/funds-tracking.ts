import { Notice, type App, type TFile } from "obsidian";
import { isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ItemRecord } from "../../campaign/record/campaign";
import { itemKeyOf } from "../../characters/imported/lists/item-key";
import { withoutEscapes } from "../../characters/imported/reading/shown-text";
import type { FundsLook, ItemTracking, SettledStatus } from "../../characters/imported/tracking/item-tracking";
import type { Gate } from "../../fence/gate/gatekeeper";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { openSource } from "../../views/opening/open-view";
import { openItemDialogAs } from "../items/open-item";
import { ItemsLook } from "./items-look";
import { TrackItemModal } from "./track-item-modal";
import { trackedLineOf } from "./tracked-item";
import { TrackingSave } from "./tracking-save";

export const NO_SESSION = "Start a session first: tracked items are written into a session note.";
export const NOT_THE_SHOWN_CAMPAIGN = "Show this character's campaign first, then track its items.";
export const ITEM_GONE = "That item isn't on the funds page any more.";

class FocusReturn {
  constructor(private readonly returnFocus: () => void) {}

  closed(): void {
    this.returnFocus();
  }
}

class ItemNote {
  constructor(
    private readonly app: App,
    private readonly gate: Gate,
    private readonly item: ItemRecord,
  ) {}

  show(): void {
    void openSource(this.app, this.gate, this.item.source);
  }
}

export class FundsTracking implements ItemTracking {
  constructor(
    private readonly app: App,
    private readonly gate: Gate,
    private readonly store: CampaignStore,
  ) {}

  lookAt(file: TFile, written: readonly string[]): FundsLook | null {
    if (this.shownFolderOf(file) === null) return null;
    return new ItemsLook(this.store.current.items, file.basename, written);
  }

  track(file: TFile, written: string, returnFocus: () => void): void {
    const folder = this.shownFolderOf(file);
    if (folder === null) {
      new Notice(NOT_THE_SHOWN_CAMPAIGN);
      return;
    }
    const sessionPath = sessionForDialog(this.gate.files, folder, { activePath: null, earliestSession: 0, noSession: NO_SESSION });
    if (sessionPath === null) return;
    const holder = `[[${this.gate.metadata.fileToLinktext(file, sessionPath, true)}]]`;
    const tracked = { line: trackedLineOf(holder, written), key: itemKeyOf(written), holderName: file.basename };
    const saving = new TrackingSave(this.gate.files, this.store, tracked, sessionPath);
    const shown = { name: withoutEscapes(written), holder: file.basename, writesTo: sessionLabelOf(sessionPath) };
    const focus = new FocusReturn(returnFocus);
    new TrackItemModal(this.app, shown, saving, focus.closed.bind(focus)).open();
  }

  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void {
    const item = this.itemNamed(name);
    if (this.shownFolderOf(file) === null || item === null) {
      new Notice(ITEM_GONE);
      return;
    }
    const note = new ItemNote(this.app, this.gate, item);
    const focus = new FocusReturn(returnFocus);
    openItemDialogAs(this.app, this.gate, this.store, { name, status }, note.show.bind(note), focus.closed.bind(focus), null);
  }

  private itemNamed(name: string): ItemRecord | null {
    for (const item of this.store.current.items) {
      if (item.name === name) return item;
    }
    return null;
  }

  private shownFolderOf(file: TFile): string | null {
    const folder = this.store.campaignFolder;
    if (folder === null) return null;
    if (isInReferenceFolder(characterReferenceKind, folder, file.path) === false) return null;
    return folder;
  }
}
