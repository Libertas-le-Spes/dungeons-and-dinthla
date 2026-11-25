import type { ItemRecord } from "../../campaign/record/campaign";
import { scrollListParts } from "../../views/components/layout/scroll-list";
import { LinkName, type LinkOpener } from "../../views/components/rows/link-name";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Details, Div, Heading2, Heading3, List, ListItem, Paragraph, Section, Span, Summary } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { isItemNamed } from "../item-notes/item-of-note";
import { THE_PARTY_LABEL, type HolderGroup, type ItemSummary } from "../items/item-groups";
import type { LedgerLine } from "./funds-summary";
import { ItemRow } from "./rows/item-row";

export interface ItemsBoxParts {
  opener: LinkOpener;
  noteExists(name: string, sourcePath: string): boolean;
  openItem(item: ItemRecord): void;
  shownName: string | null;
  label: string;
}

export interface ItemsShown {
  summary: ItemSummary;
  ledger: readonly LedgerLine[];
  empty: string;
}

function heldText(count: number): string {
  if (count === 0) return "";
  return `${count} held`;
}

export class ItemsBox {
  private readonly panel = new KeptHandle();
  private readonly fold = new KeptHandle();
  private readonly heldRows = new Map<string, KeptHandle>();
  private readonly goneRows = new Map<string, KeptHandle>();

  constructor(private readonly parts: ItemsBoxParts) {}

  tree(): ViewElement {
    return new Section({ cls: ["dd-panel", "dd-items-panel"], bindings: [new HandleRequest(this.panel)] });
  }

  render({ summary, ledger, empty }: ItemsShown): void {
    this.heldRows.clear();
    this.goneRows.clear();
    const box: ViewElement[] = [];
    if (summary.groups.length === 0) box.push(new Paragraph({ cls: ["dd-empty"], text: empty }));
    for (const group of summary.groups) box.push(this.holderOf(group), new List({ cls: ["dd-list"] }, this.rowsOf(group.items, ledger, this.heldRows)));
    box.push(this.foldOf(summary.gone, ledger));
    const title = new Heading2({ cls: ["dd-title"], text: "Items" }, [new Span({ cls: ["dd-count"], text: heldText(summary.heldCount) })]);
    this.panel.showInside([title, new Div(scrollListParts({ role: "group" }, this.parts.label), box)]);
    if (summary.gone.some(this.isShown.bind(this))) this.fold.setOpen(true);
  }

  holds(name: string): boolean {
    return this.heldRows.has(name) || this.goneRows.has(name);
  }

  focus(name: string): void {
    const held = this.heldRows.get(name);
    if (held !== undefined) {
      held.focus();
      return;
    }
    const gone = this.goneRows.get(name);
    if (gone === undefined) return;
    this.fold.setOpen(true);
    gone.focus();
  }

  private holderOf(group: HolderGroup): ViewElement {
    if (group.holder === "") return new Heading3({ cls: ["dd-holder"], text: THE_PARTY_LABEL });
    if (!this.parts.noteExists(group.holder, group.sourcePath)) return new Heading3({ cls: ["dd-holder"], text: group.holder });
    return new Heading3({ cls: ["dd-holder"] }, [new LinkName(group.holder, group.sourcePath, this.parts.opener).build(group.holder)]);
  }

  private foldOf(gone: ItemRecord[], ledger: readonly LedgerLine[]): ViewElement {
    const summary = new Summary({ text: "Gone" }, [new Span({ cls: ["dd-count"], text: String(gone.length) })]);
    let rows: ViewElement[] = [new ListItem({ cls: ["dd-empty"], text: "Nothing sold, used or lost yet." })];
    if (gone.length > 0) rows = this.rowsOf(gone, ledger, this.goneRows);
    return new Details({ cls: ["dd-folded"], bindings: [new HandleRequest(this.fold)] }, [summary, new List({ cls: ["dd-list"] }, rows)]);
  }

  private rowsOf(items: ItemRecord[], ledger: readonly LedgerLine[], kept: Map<string, KeptHandle>): ViewElement[] {
    return items.map(this.rowOf.bind(this, ledger, kept));
  }

  private rowOf(ledger: readonly LedgerLine[], kept: Map<string, KeptHandle>, item: ItemRecord): ViewElement {
    const handle = new KeptHandle();
    kept.set(item.name, handle);
    const open = new RunAction(this.parts.openItem.bind(this.parts, item));
    return new ItemRow().build({ item, ledger, isShown: this.isShown(item) }, open, [new HandleRequest(handle)]);
  }

  private isShown(item: ItemRecord): boolean {
    if (this.parts.shownName === null) return false;
    return isItemNamed(item, this.parts.shownName);
  }
}
