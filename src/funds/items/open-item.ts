import type { App } from "obsidian";
import type { ItemRecord, Source } from "../../campaign/campaign";
import { charactersIn } from "../../campaign/characters";
import type { CampaignStore } from "../../campaign/campaign-store";
import { sessionLabelOf } from "../../campaign/session-file";
import { sessionForDialog } from "../../campaign/session-for-dialog";
import { openSource } from "../../views/opening/open-view";
import { ItemModal } from "./item-modal";
import { holderOptionOf, holderOptions, latestSessionOfItem } from "./item-plan";
import { openedItem } from "./item-writer";
import type { Gate } from "../../fence/gatekeeper";

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
  new ItemModal(app, item, opened.edit, holders, sessionLabelOf(sessionPath), opened.save, openNoteAt, onClosed).open();
}
