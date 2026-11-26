import type { Source } from "../../campaign/record/campaign";
import { charactersIn, type CharacterLinks } from "../../characters/reading/characters";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { ItemDialog } from "./item-dialog";
import { itemNamedAt } from "./item-named";
import { holderOptionOf, holderOptions, latestSessionOfItem, type ItemEdit, type ItemStatus } from "./item-plan";
import { openedItem } from "./item-writer";
import type { NoteStore } from "../../host/notes/note-store";
import type { DialogShowing } from "../../views/dialogs/dialog-view";

export interface ItemNotes extends CharacterLinks {
  readonly store: Pick<NoteStore, "notes" | "files" | "note" | "read" | "change">;
}

export interface ItemOpening {
  readonly showing: DialogShowing;
  readonly notes: ItemNotes;
  readonly openNoteAt: (source: Source) => void;
}

const NO_SESSION = "Start a session first: item changes are written into a session note.";

export function openItemDialog(
  opening: ItemOpening,
  store: CampaignStore,
  name: string,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
  source: Source | null,
  syntax: PropertiesSyntax,
): void {
  openItemDialogAs(opening, store, { name, status: null, source }, openNote, onClosed, activePath, syntax);
}

export interface ItemAsked {
  name: string;
  status: ItemStatus | null;
  source: Source | null;
}

function editAsked(opened: ItemEdit, asked: ItemAsked): ItemEdit {
  if (asked.status === null) return opened;
  return { ...opened, status: asked.status };
}

export function openItemDialogAs(
  opening: ItemOpening,
  store: CampaignStore,
  asked: ItemAsked,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
  syntax: PropertiesSyntax,
): void {
  const name = asked.name;
  const item = itemNamedAt(store.current.items, name, asked.source);
  const folder = store.campaignFolder;
  if (item === null || folder === null) {
    openNote();
    return;
  }
  const wanted = { activePath, earliestSession: latestSessionOfItem(item, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(opening.notes.store, opening.showing.telling, folder, wanted);
  if (sessionPath === null) return;
  const holders = holderOptions(
    store.current.items.map(holderOptionOf),
    charactersIn(opening.notes, folder, sessionPath).map((character) => ({ text: `[[${character.linktext}]]`, label: character.name })),
  );
  const opened = openedItem(opening.notes.store, store, item, sessionPath, syntax);
  const dialog = new ItemDialog(opening.showing.telling, item, editAsked(opened.edit, asked), holders, sessionLabelOf(sessionPath), opened.save, opening.openNoteAt, onClosed);
  opening.showing.dialogs.open(dialog);
}
