import type { ItemEventKind, ItemRecord, Source } from "../../../campaign/record/campaign";
import { sessionLabelOf } from "../../../campaign/paths/session-file";
import { shownItemName } from "../../../characters/imported/lists/shown-item-name";
import { SourceRow } from "../../../views/components/rows/source-row";
import type { ElementBinding } from "../../../views/elements/bindings/element-binding";
import type { PageAction } from "../../../views/elements/bindings/page-action";
import { ListItem, PlainText, Span } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { LedgerLine } from "../funds-summary";

type GoneKind = "sold" | "used" | "lost";

const GONE_WORDS: Record<GoneKind, string> = { sold: "Sold", used: "Used up", lost: "Lost" };

const SHOWN_ROW_CLASSES = ["dd-row-shown"];

function isGoneKind(kind: ItemEventKind): kind is GoneKind {
  return kind in GONE_WORDS;
}

function goneWordOf(item: ItemRecord): string | null {
  if (item.gone === null || !isGoneKind(item.gone.kind)) return null;
  return GONE_WORDS[item.gone.kind];
}

export function rowSourceOf(item: ItemRecord): Source {
  if (item.gone === null) return item.source;
  return item.gone.source;
}

function isSaleLogged(item: ItemRecord, ledger: readonly LedgerLine[]): boolean {
  if (item.gone === null) return false;
  const { path, line } = item.gone.source;
  return ledger.some(({ record }) => record.source.path === path && record.source.line === line);
}

export interface ItemRowShown {
  item: ItemRecord;
  ledger: readonly LedgerLine[];
  isShown: boolean;
}

export class ItemRow {
  build({ item, ledger, isShown }: ItemRowShown, open: PageAction, bindings: readonly ElementBinding[]): ListItem {
    const source = rowSourceOf(item);
    const goneWord = goneWordOf(item);
    const children = [this.markOf(goneWord), new Span({ cls: ["dd-body"] }, [this.nameOf(item, goneWord), this.metaOf(item, ledger, goneWord, source)])];
    let cls: readonly string[] = [];
    let current: string | undefined = undefined;
    if (isShown) {
      cls = SHOWN_ROW_CLASSES;
      current = "true";
    }
    return new ListItem({}, [new SourceRow(source, open).build(children, { cls, dataItem: item.name, current, bindings })]);
  }

  private markOf(goneWord: string | null): ViewElement {
    if (goneWord === null) return new Span({ cls: ["dd-mark", "dd-mark-ledger"], text: "$" });
    return new Span({ cls: ["dd-mark", "dd-mark-gone"], text: "✕", label: goneWord });
  }

  private nameOf(item: ItemRecord, goneWord: string | null): ViewElement {
    const cls = ["dd-text"];
    if (goneWord !== null) cls.push("dd-gone");
    return new Span({ cls, text: shownItemName(item.name) });
  }

  private metaOf(item: ItemRecord, ledger: readonly LedgerLine[], goneWord: string | null, source: Source): ViewElement {
    const meta: ViewElement[] = [];
    if (goneWord !== null) {
      meta.push(new PlainText(goneWord));
      if (isSaleLogged(item, ledger)) meta.push(new PlainText(" · sale in the ledger"));
      meta.push(new PlainText(" · "));
    }
    if (goneWord === null && item.held > 1) meta.push(new PlainText(`× ${item.held} · `));
    meta.push(new PlainText(sessionLabelOf(source.path)));
    return new Span({ cls: ["dd-meta"] }, meta);
  }
}
