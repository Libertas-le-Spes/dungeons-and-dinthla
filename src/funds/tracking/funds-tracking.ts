import { Notice, type App, type TFile } from "obsidian";
import { isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ItemRecord } from "../../campaign/record/campaign";
import { isImporterWritten } from "../../characters/imported/lists/importer-written";
import { withoutEscapes } from "../../characters/imported/reading/shown-text";
import type { FundsLook, ItemTracking, SettledStatus, SheetItem } from "../../characters/imported/tracking/item-tracking";
import type { Gate } from "../../fence/gate/gatekeeper";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { openSource } from "../../views/opening/open-view";
import { itemNamed } from "../items/item-named";
import { openItemDialogAs } from "../items/open-item";
import { ItemsLook, type HolderPaths } from "./items-look";
import { TrackItemModal } from "./track-item-modal";
import { textToTrack } from "./text-to-track";
import { trackedCountOf, trackedItemOf } from "./tracked-item";
import { TrackingSave } from "./tracking-save";

export const NO_SESSION = "Start a session first: tracked items are written into a session note.";
export const NOT_THE_SHOWN_CAMPAIGN = "Show this character's campaign first, then track its items.";
export const NOT_IN_A_CAMPAIGN = "This character's note isn't in a campaign's Characters folder, so its items can't be tracked on a funds page.";
export const NOT_AS_IMPORTED = "That line isn't as the import wrote it, so it can't be tracked. Import the character again to track it.";
export const ITEM_GONE = "That item isn't on the funds page any more.";
export const NOT_INERT_ON_PAGE =
  "The funds page writes that item in a way that could turn into a link, a tag or other active text, so it wasn't tracked. Write its line in the session by hand instead.";

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

class GateHolderPaths implements HolderPaths {
  constructor(private readonly gate: Gate) {}

  pathOf(linkpath: string, sourcePath: string): string | null {
    const file = this.gate.metadata.getFirstLinkpathDest(linkpath, sourcePath);
    if (file === null) return null;
    return file.path;
  }
}

export class FundsTracking implements ItemTracking {
  constructor(
    private readonly app: App,
    private readonly gate: Gate,
    private readonly store: CampaignStore,
    private readonly campaignFolders: () => string[],
  ) {}

  lookAt(file: TFile, written: readonly string[]): FundsLook | null {
    if (this.shownFolderOf(file) === null) return null;
    return new ItemsLook(this.store.current.items, file, written, new GateHolderPaths(this.gate));
  }

  whyNotTracked(file: TFile): string {
    if (this.isInSomeCampaign(file)) return NOT_THE_SHOWN_CAMPAIGN;
    return NOT_IN_A_CAMPAIGN;
  }

  track(file: TFile, item: SheetItem, returnFocus: () => void): void {
    const written = item.written;
    const folder = this.shownFolderOf(file);
    if (folder === null) {
      new Notice(this.whyNotTracked(file));
      return;
    }
    if (!isImporterWritten(written)) {
      new Notice(NOT_AS_IMPORTED);
      return;
    }
    const sessionPath = sessionForDialog(this.gate.files, folder, { activePath: null, earliestSession: 0, noSession: NO_SESSION });
    if (sessionPath === null) return;
    const holder = `[[${this.gate.metadata.fileToLinktext(file, sessionPath, true)}]]`;
    const text = textToTrack(this.store.current.items, written);
    if (text === null) {
      new Notice(NOT_INERT_ON_PAGE);
      return;
    }
    const tracked = trackedItemOf({ holderText: holder, written: text, holderName: file.basename, count: trackedCountOf(item.count) });
    const saving = new TrackingSave(this.gate.files, this.store, tracked, sessionPath);
    const shown = { name: withoutEscapes(text), holder: file.basename, writesTo: sessionLabelOf(sessionPath), line: tracked.line };
    new TrackItemModal(this.app, shown, saving, returnFocus).open();
  }

  settle(file: TFile, name: string, status: SettledStatus, returnFocus: () => void): void {
    if (this.shownFolderOf(file) === null) {
      new Notice(this.whyNotTracked(file));
      return;
    }
    const item = itemNamed(this.store.current.items, name);
    if (item === null) {
      new Notice(ITEM_GONE);
      return;
    }
    const note = new ItemNote(this.app, this.gate, item);
    openItemDialogAs(this.app, this.gate, this.store, { name, status }, note.show.bind(note), returnFocus, null);
  }

  private isInSomeCampaign(file: TFile): boolean {
    for (const folder of this.campaignFolders()) {
      if (isInReferenceFolder(characterReferenceKind, folder, file.path)) return true;
    }
    return false;
  }

  private shownFolderOf(file: TFile): string | null {
    const folder = this.store.campaignFolder;
    if (folder === null) return null;
    if (isInReferenceFolder(characterReferenceKind, folder, file.path) === false) return null;
    return folder;
  }
}
