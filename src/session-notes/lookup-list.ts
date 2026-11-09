import type { LookupMatch } from "../lookups/lookup";
import { addLookupMatch } from "../lookups/lookup-match-row";

export class LookupList {
  private readonly element: HTMLElement;
  private readonly heading: HTMLElement;
  private readonly list: HTMLElement;
  private matches: LookupMatch[] = [];
  private rows: HTMLElement[] = [];
  private selected = 0;
  private open = false;

  constructor(
    parent: HTMLElement,
    private readonly pick: (match: LookupMatch) => void,
  ) {
    this.element = parent.createDiv({ cls: "dd-box-lookups" });
    this.heading = this.element.createDiv({ cls: "dd-box-lookups-heading" });
    this.list = this.element.createEl("ul", { attr: { role: "listbox" } });
    this.element.toggle(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(heading: string, matches: LookupMatch[], keywords: string[]): void {
    this.heading.setText(heading);
    this.list.setAttribute("aria-label", heading);
    this.matches = matches;
    this.list.empty();
    this.rows = matches.map((match) => this.addRow(match, keywords));
    this.select(0);
    this.element.toggle(true);
    this.open = true;
  }

  close(): void {
    this.element.toggle(false);
    this.open = false;
    this.matches = [];
    this.rows = [];
  }

  move(step: number): void {
    const count = this.matches.length;
    if (count === 0) return;
    this.select((this.selected + step + count) % count);
  }

  pickSelected(): void {
    const match = this.matches[this.selected];
    if (match === undefined) return;
    this.pick(match);
  }

  private addRow(match: LookupMatch, keywords: string[]): HTMLElement {
    const row = this.list.createEl("li", { cls: "dd-box-lookup", attr: { role: "option" } });
    addLookupMatch(row, match, keywords);
    row.addEventListener("mousedown", (event) => event.preventDefault());
    row.addEventListener("click", () => this.pick(match));
    return row;
  }

  private select(index: number): void {
    this.selected = index;
    for (const [rowIndex, row] of this.rows.entries()) row.setAttribute("aria-selected", String(rowIndex === index));
  }
}
