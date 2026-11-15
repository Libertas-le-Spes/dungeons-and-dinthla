import type { ItemEvent, ItemEventKind, ItemRecord } from "../campaign/record/campaign";
import { shownItemName } from "../characters/imported/lists/shown-item-name";
import { addRowButton, type LinkActions } from "../views/lists/linked-text";

export interface ItemEventLine {
  item: ItemRecord;
  event: ItemEvent;
}

const EVENT_WORDS: Record<ItemEventKind, string> = {
  named: "Item",
  changed: "Changed",
  sold: "Sold",
  used: "Used up",
  lost: "Lost",
};

export function addItemEventRow(list: HTMLElement, line: ItemEventLine, actions: LinkActions): void {
  const row = addRowButton(list, line.event.source, actions);
  row.setAttr("data-item", line.item.name);
  row.createSpan({ cls: "dd-mark dd-mark-ledger", text: "$" });
  const body = row.createSpan({ cls: "dd-body" });
  body.createSpan({ cls: "dd-text", text: shownItemName(line.item.name) });
  body.createSpan({ cls: "dd-meta", text: EVENT_WORDS[line.event.kind] });
}
