import type { Campaign } from "../campaign/campaign";
import { addLinkedText, type LinkActions } from "../views/linked-text";
import { lineStateOf, type LineState } from "./line-state";
import type { WrittenLine } from "./written-lines";

const NO_LINES = "No notes in this session yet. Type one above and save it.";

function countText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 note";
  return `${count} notes`;
}

function glyphClassOf(line: WrittenLine): string {
  if (line.marker === null) return "dd-line-glyph";
  return `dd-line-glyph dd-marker dd-marker-${line.marker}`;
}

function addState(row: HTMLElement, text: HTMLElement, state: LineState | null): void {
  if (state === null) return;
  row.createSpan({ cls: "dd-line-state", text: state.sign, attr: { "aria-label": state.label, title: state.label } });
  if (state.struck) text.addClass("dd-line-struck");
}

export class LinesList {
  private readonly count: HTMLElement;
  private readonly list: HTMLElement;

  constructor(
    parent: HTMLElement,
    private readonly actions: LinkActions,
  ) {
    const panel = parent.createEl("section", { cls: "dd-notes-panel dd-lines-panel" });
    const head = panel.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Notes" });
    this.count = title.createSpan({ cls: "dd-count" });
    this.list = panel.createEl("ul", { cls: "dd-written-lines", attr: { "aria-live": "polite" } });
  }

  show(lines: WrittenLine[], campaign: Campaign): void {
    this.count.setText(countText(lines.length));
    this.list.empty();
    if (lines.length === 0) this.list.createEl("li", { cls: "dd-empty", text: NO_LINES });
    for (const line of lines) this.addLine(line, campaign);
  }

  private addLine(line: WrittenLine, campaign: Campaign): void {
    const row = this.list.createEl("li", { cls: "dd-written-line", attr: { "data-line": String(line.source.line) } });
    row.createSpan({ cls: glyphClassOf(line), text: line.glyph, attr: { "aria-hidden": "true" } });
    const text = row.createSpan({ cls: "dd-line-text" });
    addLinkedText(text, line.text, [], line.source.path, this.actions);
    addState(row, text, lineStateOf(campaign, line.source));
  }
}
