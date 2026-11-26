import type { Campaign, Source } from "../../campaign/record/campaign";
import type { CampaignStore } from "../../campaign/reading/campaign-store";
import type { LinkOpener } from "../components/rows/link-name";
import { ChangeBinding, HandleRequest, PressBinding } from "../elements/bindings/bindings";
import type { TextChange } from "../elements/bindings/binding-wiring";
import type { ElementBinding } from "../elements/bindings/element-binding";
import { KeptHandle } from "../elements/bindings/kept-handle";
import type { PageAction } from "../elements/bindings/page-action";
import { RunAction } from "../elements/bindings/run-action";
import { Button, Details, Div, Heading2, List, ListItem, Span, Summary } from "../elements/kinds/containers";
import { SearchInput } from "../elements/kinds/fields";
import type { ViewElement } from "../elements/view-element";
import type { PageView, ShownPage } from "../pages/page-view";
import { ShownRows } from "../pages/shown-rows";
import type { OpenRow } from "../threads/thread-openers";
import { keywordsOf } from "./keywords";
import { RowFocus } from "./row-focus";

export interface ListContents<T> {
  open: T[];
  folded: T[];
  openCount: number;
  foldedCount: number;
}

export interface ListCreate {
  label: string;
  open(returnFocus: () => void): void;
}

export interface ListItemRecord {
  readonly source: Source;
}

export interface ListKind<T extends ListItemRecord> {
  itemName: string;
  openWord: string;
  foldedWord: string;
  emptyHint: string;
  contentsOf(campaign: Campaign, keywords: string[]): ListContents<T>;
  rowOf(item: T, keywords: string[], opener: LinkOpener, open: PageAction, bindings: readonly ElementBinding[]): ViewElement;
}

const PAGE_CLASSES = ["dd-root", "dd-list-view"];

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

class FilterWords implements TextChange {
  value = "";

  constructor(private readonly onChange: () => void) {}

  changed(value: string): void {
    this.value = value;
    this.onChange();
  }
}

export class ListPage<T extends ListItemRecord> implements ShownPage {
  readonly cls = PAGE_CLASSES;
  private readonly filter = new FilterWords(this.render.bind(this));
  private readonly filterBox = new KeptHandle();
  private readonly createButton = new KeptHandle();
  private readonly openCount = new KeptHandle();
  private readonly openList = new KeptHandle();
  private readonly fold = new KeptHandle();
  private readonly foldedCount = new KeptHandle();
  private readonly foldedList = new KeptHandle();
  private readonly openRows = new ShownRows();
  private readonly foldedRows = new ShownRows();
  private readonly rowFocus = new RowFocus();
  private stop: (() => void) | null = null;

  constructor(
    private readonly store: CampaignStore,
    private readonly opener: LinkOpener,
    private readonly openRow: OpenRow,
    private readonly kind: ListKind<T>,
    private readonly create: ListCreate | null,
  ) {}

  opened(view: PageView): void {
    view.show([this.headTree(), new List({ cls: ["dd-list"], bindings: [new HandleRequest(this.openList)] }), this.foldTree()]);
    this.stop = this.store.subscribe(this.render.bind(this));
    this.render();
  }

  closed(): void {
    if (this.stop !== null) this.stop();
    this.stop = null;
  }

  private headTree(): ViewElement {
    const title = new Heading2({ cls: ["dd-title"], text: `${capitalised(this.kind.openWord)} ${this.kind.itemName}s` }, [new Span({ cls: ["dd-count"], bindings: [new HandleRequest(this.openCount)] })]);
    const filter = new SearchInput({
      cls: ["dd-filter"],
      placeholder: "Filter by keywords",
      label: `Filter ${this.kind.itemName}s`,
      bindings: [new ChangeBinding(this.filter), new HandleRequest(this.filterBox)],
    });
    const head: ViewElement[] = [title, filter];
    if (this.create !== null) head.push(this.createTree(this.create));
    return new Div({ cls: ["dd-head"] }, head);
  }

  private createTree(create: ListCreate): ViewElement {
    const pressed = new RunAction(this.openCreate.bind(this, create));
    return new Button({ cls: ["dd-create"], text: create.label, bindings: [new PressBinding(pressed), new HandleRequest(this.createButton)] });
  }

  private foldTree(): ViewElement {
    const summary = new Summary({ text: capitalised(this.kind.foldedWord) }, [new Span({ cls: ["dd-count"], bindings: [new HandleRequest(this.foldedCount)] })]);
    return new Details({ cls: ["dd-folded"], bindings: [new HandleRequest(this.fold)] }, [summary, new List({ cls: ["dd-list"], bindings: [new HandleRequest(this.foldedList)] })]);
  }

  private openCreate(create: ListCreate): void {
    create.open(this.createButton.focus.bind(this.createButton));
  }

  private render(): void {
    const keywords = keywordsOf(this.filter.value);
    const contents = this.kind.contentsOf(this.store.current, keywords);
    if (contents.openCount === 0) this.openCount.setText("");
    else this.openCount.setText(`${contents.openCount} ${this.kind.openWord}`);
    this.foldedCount.setText(String(contents.foldedCount));
    this.openList.showInside(this.rowsOf(this.openRows, contents.open, keywords, this.openEmptyText(contents)));
    this.foldedList.showInside(this.rowsOf(this.foldedRows, contents.folded, keywords, this.foldedEmptyText(contents)));
    this.rowFocus.afterRender();
  }

  private rowsOf(rows: ShownRows, items: T[], keywords: string[], emptyText: string): ViewElement[] {
    rows.clear();
    if (items.length === 0) return [new ListItem({ cls: ["dd-empty"], text: emptyText })];
    return items.map(this.rowOf.bind(this, rows, keywords));
  }

  private rowOf(rows: ShownRows, keywords: string[], item: T): ViewElement {
    const open = new RunAction(this.open.bind(this, item.source));
    return this.kind.rowOf(item, keywords, this.opener, open, [new HandleRequest(rows.handleFor(item.source))]);
  }

  private open(source: Source): void {
    this.openRow(source, this.afterClose.bind(this, source));
  }

  private afterClose(source: Source, changed: boolean): void {
    this.rowFocus.afterClose(this.focusRow.bind(this, source), changed, this.filterBox.focus.bind(this.filterBox));
  }

  private focusRow(source: Source): boolean {
    if (this.openRows.focus(source)) return true;
    if (!this.foldedRows.holds(source)) return false;
    this.fold.setOpen(true);
    return this.foldedRows.focus(source);
  }

  private openEmptyText(contents: ListContents<T>): string {
    if (contents.openCount === 0) return this.kind.emptyHint;
    return `No ${this.kind.openWord} ${this.kind.itemName} matches “${this.filter.value.trim()}”.`;
  }

  private foldedEmptyText(contents: ListContents<T>): string {
    if (contents.foldedCount === 0) return `Nothing ${this.kind.foldedWord} yet.`;
    return `No ${this.kind.foldedWord} ${this.kind.itemName} matches “${this.filter.value.trim()}”.`;
  }
}
