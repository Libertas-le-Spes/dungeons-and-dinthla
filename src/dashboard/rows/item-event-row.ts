import type { ItemEvent, ItemEventKind, ItemRecord } from "../../campaign/record/campaign";
import { shownItemName } from "../../characters/imported/lists/shown-item-name";
import { SourceRow } from "../../views/components/rows/source-row";
import type { ElementBinding } from "../../views/elements/bindings/element-binding";
import type { PageAction } from "../../views/elements/bindings/page-action";
import { ListItem, Span } from "../../views/elements/kinds/containers";

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

export class ItemEventRow {
  build(line: ItemEventLine, open: PageAction, bindings: readonly ElementBinding[] = []): ListItem {
    const body = new Span({ cls: ["dd-body"] }, [new Span({ cls: ["dd-text"], text: shownItemName(line.item.name) }), new Span({ cls: ["dd-meta"], text: EVENT_WORDS[line.event.kind] })]);
    const children = [new Span({ cls: ["dd-mark", "dd-mark-ledger"], text: "$" }), body];
    return new ListItem({}, [new SourceRow(line.event.source, open).build(children, { cls: [], dataItem: line.item.name, bindings })]);
  }
}
