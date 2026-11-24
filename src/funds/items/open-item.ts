import type { App } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import { charactersIn } from "../../characters/reading/characters";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { sessionLabelOf, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { openSource } from "../../views/opening/open-view";
import { ItemModal } from "./item-modal";
import { itemNamedAt } from "./item-named";
import { holderOptionOf, holderOptions, latestSessionOfItem, type ItemEdit, type ItemStatus } from "./item-plan";
import { openedItem } from "./item-writer";
import type { Gate } from "../../fence/gate/gatekeeper";
import { OBSIDIAN_TELLING } from "../../obsidian/views/frames/obsidian-telling";

const NO_SESSION = "Start a session first: item changes are written into a session note.";

export function openItemDialog(
  app: App,
  gate: Gate,
  store: CampaignStore,
  name: string,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
  source: Source | null,
  syntax: PropertiesSyntax,
): void {
  openItemDialogAs(app, gate, store, { name, status: null, source }, openNote, onClosed, activePath, syntax);
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
  app: App,
  gate: Gate,
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
  const sessionPath = sessionForDialog(gate.notes.store, OBSIDIAN_TELLING, folder, wanted);
  if (sessionPath === null) return;
  const holders = holderOptions(
    store.current.items.map(holderOptionOf),
    charactersIn(gate.notes, folder, sessionPath).map((character) => ({ text: `[[${character.linktext}]]`, label: character.name })),
  );
  const opened = openedItem(gate.notes.store, store, item, sessionPath, syntax);
  const openNoteAt = (source: Source) => void openSource(app, gate, source);
  new ItemModal(app, item, editAsked(opened.edit, asked), holders, sessionLabelOf(sessionPath), opened.save, openNoteAt, onClosed).open();
}
