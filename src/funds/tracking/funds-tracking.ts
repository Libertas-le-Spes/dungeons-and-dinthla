import type { NoteRef } from "../../host/notes/note-ref";
import { isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { ItemRecord } from "../../campaign/record/campaign";
import { isImporterWritten } from "../../characters/imported/lists/importer-written";
import { withoutEscapes } from "../../characters/imported/reading/shown-text";
import { unlink } from "../../notes/parts/link";
import type { FundsLook, ItemTracking, SettledStatus, SheetItem } from "../../characters/imported/tracking/item-tracking";
import type { LinkLookup } from "../../host/notes/link-lookup";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { itemNamed } from "../items/item-named";
import { openItemDialogAs, type ItemNotes, type ItemOpening } from "../items/open-item";
import { ItemsLook, type HolderPaths } from "./items-look";
import { TrackItemDialog } from "./track-item-dialog";
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

export interface TrackingNotes extends ItemNotes {
  readonly links: Pick<LinkLookup, "target" | "linkTextTo">;
}

export interface TrackingOpening extends ItemOpening {
  readonly notes: TrackingNotes;
}

class ItemNote {
  constructor(
    private readonly opening: ItemOpening,
    private readonly item: ItemRecord,
  ) {}

  show(): void {
    this.opening.openNoteAt(this.item.source);
  }
}

class NoteHolderPaths implements HolderPaths {
  constructor(private readonly links: Pick<LinkLookup, "target">) {}

  pathOf(linkpath: string, sourcePath: string): string | null {
    const file = this.links.target(linkpath, sourcePath);
    if (file === null) return null;
    return file.path;
  }
}

export class FundsTracking implements ItemTracking {
  constructor(
    private readonly opening: TrackingOpening,
    private readonly store: CampaignStore,
    private readonly campaignFolders: () => string[],
    private readonly syntax: PropertiesSyntax,
  ) {}

  lookAt(file: NoteRef, written: readonly string[]): FundsLook | null {
    if (this.shownFolderOf(file) === null) return null;
    return new ItemsLook(this.store.current.items, file, written, new NoteHolderPaths(this.opening.notes.links));
  }

  whyNotTracked(file: NoteRef): string {
    if (this.isInSomeCampaign(file)) return NOT_THE_SHOWN_CAMPAIGN;
    return NOT_IN_A_CAMPAIGN;
  }

  track(file: NoteRef, item: SheetItem, returnFocus: () => void): void {
    const written = item.written;
    const folder = this.shownFolderOf(file);
    if (folder === null) {
      this.opening.showing.telling.say(this.whyNotTracked(file));
      return;
    }
    if (!isImporterWritten(written)) {
      this.opening.showing.telling.say(NOT_AS_IMPORTED);
      return;
    }
    const sessionPath = sessionForDialog(this.opening.notes.store, this.opening.showing.telling, folder, { activePath: null, earliestSession: 0, noSession: NO_SESSION });
    if (sessionPath === null) return;
    const holder = `[[${this.opening.notes.links.linkTextTo(file, sessionPath, true)}]]`;
    const text = textToTrack(this.store.current.items, written);
    if (text === null) {
      this.opening.showing.telling.say(NOT_INERT_ON_PAGE);
      return;
    }
    const tracked = trackedItemOf({ holderText: holder, written: text, holderName: file.basename, count: trackedCountOf(item.count) });
    const saving = new TrackingSave(this.opening.notes.store, this.store, tracked, sessionPath, this.syntax);
    const shown = { name: withoutEscapes(unlink(text)), holder: file.basename, writesTo: sessionLabelOf(sessionPath), line: tracked.line };
    this.opening.showing.dialogs.open(new TrackItemDialog(this.opening.showing.telling, shown, saving, returnFocus));
  }

  settle(file: NoteRef, name: string, status: SettledStatus, returnFocus: () => void): void {
    if (this.shownFolderOf(file) === null) {
      this.opening.showing.telling.say(this.whyNotTracked(file));
      return;
    }
    const item = itemNamed(this.store.current.items, name);
    if (item === null) {
      this.opening.showing.telling.say(ITEM_GONE);
      return;
    }
    const note = new ItemNote(this.opening, item);
    openItemDialogAs(this.opening, this.store, { name, status, source: null }, note.show.bind(note), returnFocus, null, this.syntax);
  }

  private isInSomeCampaign(file: NoteRef): boolean {
    for (const folder of this.campaignFolders()) {
      if (isInReferenceFolder(characterReferenceKind, folder, file.path)) return true;
    }
    return false;
  }

  private shownFolderOf(file: NoteRef): string | null {
    const folder = this.store.campaignFolder;
    if (folder === null) return null;
    if (isInReferenceFolder(characterReferenceKind, folder, file.path) === false) return null;
    return folder;
  }
}
