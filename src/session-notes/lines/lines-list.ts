import type { Campaign, Source } from "../../campaign/record/campaign";
import { markerNamed } from "../../kinds/tracked-markers";
import { addLinkedText, addRowButtonIn, type LinkActions } from "../../views/lists/linked-text";
import { focusRowAt, NO_ROW, RowFocus } from "../../views/lists/row-focus";
import type { LineState } from "../../views/threads/line-state";
import { lineOpenerOf, type LineClosed, type LineOpeners, type OpenLine } from "./line-opener-of";
import { lineStateOf } from "./line-state-of";
import type { WrittenLine } from "./written-lines";

const NO_LINES = "No notes in this session yet. Type one above and save it.";

function countText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 note";
  return `${count} notes`;
}

function glyphClassOf(line: WrittenLine): string {
  if (line.marker === null) return "dd-line-glyph";
  return `dd-line-glyph dd-marker ${markerNamed(line.marker).colourClass}`;
}

function addState(row: HTMLElement, text: HTMLElement, state: LineState | null): void {
  if (state === null) return;
  row.createSpan({ cls: "dd-line-state", text: state.sign, attr: { "aria-label": state.label, title: state.label } });
  if (state.struck) text.addClass("dd-line-struck");
}

function newestFirst(lines: WrittenLine[]): WrittenLine[] {
  const shown = Array.from(lines);
  return shown.reverse();
}

export interface LinesListNeeds {
  actions: LinkActions;
  openers: LineOpeners;
}

export class LinesList {
  readonly head: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly count: HTMLElement;
  private readonly list: HTMLElement;
  private readonly rowFocus = new RowFocus();

  constructor(
    parent: HTMLElement,
    private readonly needs: LinesListNeeds,
  ) {
    this.panel = parent.createEl("section", { cls: "dd-notes-panel dd-lines-panel" });
    this.head = this.panel.createDiv({ cls: "dd-head" });
    const title = this.head.createEl("h2", { cls: "dd-title", text: "Notes" });
    this.count = title.createSpan({ cls: "dd-count" });
    this.list = this.panel.createEl("ul", { cls: "dd-written-lines", attr: { "aria-live": "polite", tabindex: "-1" } });
  }

  setShown(shown: boolean): void {
    this.panel.toggle(shown);
  }

  show(lines: WrittenLine[], campaign: Campaign): void {
    this.count.setText(countText(lines.length));
    this.list.empty();
    if (lines.length === 0) this.list.createEl("li", { cls: "dd-empty", text: NO_LINES });
    for (const line of newestFirst(lines)) this.addLine(line, campaign);
    this.rowFocus.afterRender();
  }

  private addLine(line: WrittenLine, campaign: Campaign): void {
    const item = this.list.createEl("li", { cls: "dd-written-line", attr: { "data-line": String(line.source.line) } });
    const opener = lineOpenerOf({ campaign, source: line.source, openers: this.needs.openers });
    const row = this.rowOf(item, { source: line.source, opener });
    row.createSpan({ cls: glyphClassOf(line), text: line.glyph, attr: { "aria-hidden": "true" } });
    const text = row.createSpan({ cls: "dd-line-text" });
    addLinkedText(text, line.text, [], line.source.path, this.needs.actions);
    addState(row, text, lineStateOf(campaign, line.source));
  }

  private rowOf(item: HTMLElement, { source, opener }: { source: Source; opener: OpenLine | null }): HTMLElement {
    if (opener === null) return item;
    item.addClass("dd-written-line-open");
    const actions = { ...this.needs.actions, openRow: () => opener((closed) => this.closed({ source, closed })) };
    return addRowButtonIn(item, source, actions);
  }

  private closed({ source, closed }: { source: Source; closed: LineClosed }): void {
    let focusRow = () => focusRowAt(this.list, source);
    if (closed.gone) focusRow = NO_ROW;
    this.rowFocus.afterClose(focusRow, closed.changed, () => this.list.focus());
  }
}
