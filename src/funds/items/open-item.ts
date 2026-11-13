import type { App } from "obsidian";
import type { ItemRecord, Source } from "../../campaign/record/campaign";
import { charactersIn } from "../../characters/reading/characters";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { sessionForDialog } from "../../campaign/paths/session-for-dialog";
import { openSource } from "../../views/opening/open-view";
import { ItemModal } from "./item-modal";
import { holderOptionOf, holderOptions, latestSessionOfItem, type ItemEdit, type ItemStatus } from "./item-plan";
import { openedItem } from "./item-writer";
import type { Gate } from "../../fence/gate/gatekeeper";

const NO_SESSION = "Start a session first: item changes are written into a session note.";

function itemNamed(items: ItemRecord[], name: string): ItemRecord | undefined {
  return items.find((item) => item.name === name);
}

export function openItemDialog(
  app: App,
  gate: Gate,
  store: CampaignStore,
  name: string,
  openNote: () => void,
  onClosed: (changed: boolean) => void,
  activePath: string | null,
): void {
  openItemDialogAs(app, gate, store, { name, status: null }, openNote, onClosed, activePath);
}

export interface ItemAsked {
  name: string;
  status: ItemStatus | null;
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
): void {
  const name = asked.name;
  const item = itemNamed(store.current.items, name);
  const folder = store.campaignFolder;
  if (item === undefined || folder === null) {
    openNote();
    return;
  }
  const wanted = { activePath, earliestSession: latestSessionOfItem(item, folder), noSession: NO_SESSION };
  const sessionPath = sessionForDialog(gate.files, folder, wanted);
  if (sessionPath === null) return;
  const holders = holderOptions(
    store.current.items.map(holderOptionOf),
    charactersIn(gate, folder, sessionPath).map((character) => ({ text: `[[${character.linktext}]]`, label: character.name })),
  );
  const opened = openedItem(gate.files, store, item, sessionPath);
  const openNoteAt = (source: Source) => void openSource(app, gate, source);
  new ItemModal(app, item, editAsked(opened.edit, asked), holders, sessionLabelOf(sessionPath), opened.save, openNoteAt, onClosed).open();
}
