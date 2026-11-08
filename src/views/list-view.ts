import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { Campaign, Source } from "../campaign/campaign";
import type { CampaignStore } from "../campaign/campaign-store";
import { keywordsOf } from "./keywords";
import { focusRowAt, RowFocus } from "./row-focus";
import type { LinkActions } from "./linked-text";

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

export interface ListKind<T> {
  viewType: string;
  displayText: string;
  icon: string;
  itemName: string;
  openWord: string;
  foldedWord: string;
  emptyHint: string;
  contentsOf(campaign: Campaign, keywords: string[]): ListContents<T>;
  addRow(list: HTMLElement, item: T, keywords: string[], actions: LinkActions): void;
}

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export class CampaignListView<T> extends ItemView {
  private filter!: HTMLInputElement;
  private openCount!: HTMLElement;
  private openList!: HTMLElement;
  private foldedCount!: HTMLElement;
  private foldedList!: HTMLElement;
  private readonly rowFocus = new RowFocus();

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: CampaignStore,
    private readonly actions: LinkActions,
    private readonly kind: ListKind<T>,
    private readonly create: ListCreate | null,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return this.kind.viewType;
  }

  getDisplayText(): string {
    return this.kind.displayText;
  }

  override getIcon(): string {
    return this.kind.icon;
  }

  override async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("dd-tokens", "dd-root", "dd-list-view");
    const head = root.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: `${capitalised(this.kind.openWord)} ${this.kind.itemName}s` });
    this.openCount = title.createSpan({ cls: "dd-count" });
    this.filter = head.createEl("input", {
      cls: "dd-filter",
      type: "search",
      placeholder: "Filter by keywords",
      attr: { "aria-label": `Filter ${this.kind.itemName}s` },
    });
    this.registerDomEvent(this.filter, "input", () => this.render());
    this.addCreateButton(head);
    this.openList = root.createEl("ul", { cls: "dd-list" });
    const folded = root.createEl("details", { cls: "dd-folded" });
    const summary = folded.createEl("summary", { text: capitalised(this.kind.foldedWord) });
    this.foldedCount = summary.createSpan({ cls: "dd-count" });
    this.foldedList = folded.createEl("ul", { cls: "dd-list" });
    this.register(this.store.subscribe(() => this.render()));
    this.render();
  }

  private render(): void {
    const keywords = keywordsOf(this.filter.value);
    const contents = this.kind.contentsOf(this.store.current, keywords);
    if (contents.openCount === 0) this.openCount.setText("");
    else this.openCount.setText(`${contents.openCount} ${this.kind.openWord}`);
    this.foldedCount.setText(String(contents.foldedCount));
    this.fill(this.openList, contents.open, keywords, this.openEmptyText(contents));
    this.fill(this.foldedList, contents.folded, keywords, this.foldedEmptyText(contents));
    this.rowFocus.afterRender();
  }

  private addCreateButton(head: HTMLElement): void {
    const create = this.create;
    if (create === null) return;
    const button = head.createEl("button", { cls: "dd-create", text: create.label });
    this.registerDomEvent(button, "click", () => create.open(() => button.focus()));
  }

  focusRow(source: Source, afterChange: boolean): void {
    this.rowFocus.afterClose(() => focusRowAt(this.contentEl, source), afterChange, () => this.filter.focus());
  }

  private fill(list: HTMLElement, items: T[], keywords: string[], emptyText: string): void {
    list.empty();
    if (items.length === 0) {
      list.createEl("li", { cls: "dd-empty", text: emptyText });
      return;
    }
    for (const item of items) this.kind.addRow(list, item, keywords, this.actions);
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
