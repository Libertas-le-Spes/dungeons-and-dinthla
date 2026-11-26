import type { Campaign, Source } from "../../campaign/record/campaign";
import { markerNamed } from "../../kinds/tracked-markers";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { LinkedText } from "../../views/components/rows/linked-text";
import { SourceRow } from "../../views/components/rows/source-row";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Div, Heading2, List, ListItem, Section, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { ShownRows } from "../../views/pages/shown-rows";
import { NO_ROW, RowFocus, type FocusRow } from "../../views/lists/row-focus";
import type { LineState } from "../../views/threads/line-state";
import { lineOpenerOf, type LineClosed, type LineOpeners, type OpenLine } from "./line-opener-of";
import { lineStateOf } from "./line-state-of";
import type { WrittenLine } from "./written-lines";

const NO_LINES = "No notes yet.";
const WANTED_CLASS = "dd-line-wanted";

function countText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 note";
  return `${count} notes`;
}

function glyphClassOf(line: WrittenLine): string {
  if (line.marker === null) return "dd-line-glyph";
  return `dd-line-glyph dd-marker ${markerNamed(line.marker).colourClass}`;
}

function newestFirst(lines: WrittenLine[]): WrittenLine[] {
  const shown = Array.from(lines);
  return shown.reverse();
}

export interface LinesListNeeds {
  actions: LinkOpener;
  openers: LineOpeners;
}

function classesOf(spaced: string): string[] {
  return spaced.split(" ");
}

export class LinesList {
  private readonly panel = new KeptHandle();
  private readonly count = new KeptHandle();
  private readonly list = new KeptHandle();
  private readonly rowFocus = new RowFocus();
  private readonly items = new Map<number, KeptHandle>();
  private readonly rows = new ShownRows();

  constructor(private readonly needs: LinesListNeeds) {}

  tree(headExtras: readonly ViewElement[]): ViewElement {
    const title = new Heading2({ cls: ["dd-title"], text: "Notes" }, [new Span({ cls: ["dd-count"], bindings: [new HandleRequest(this.count)] })]);
    return new Section({ cls: ["dd-notes-panel", "dd-lines-panel"], bindings: [new HandleRequest(this.panel)] }, [
      new Div({ cls: ["dd-head"] }, [title, ...headExtras]),
      new List({ cls: ["dd-written-lines"], live: "polite", tabIndex: -1, bindings: [new HandleRequest(this.list)] }),
    ]);
  }

  reveal(line: number): void {
    const item = this.items.get(line);
    if (item === undefined) return;
    item.setClassOn(WANTED_CLASS, true);
    item.bringIntoView();
  }

  setShown(shown: boolean): void {
    this.panel.setHidden(!shown);
  }

  show(lines: WrittenLine[], campaign: Campaign): void {
    this.count.setText(countText(lines.length));
    this.items.clear();
    this.rows.clear();
    const shown: ViewElement[] = [];
    if (lines.length === 0) shown.push(new ListItem({ cls: ["dd-empty"], text: NO_LINES }));
    for (const line of newestFirst(lines)) shown.push(this.lineOf(line, campaign));
    this.list.showInside(shown);
    this.rowFocus.afterRender();
  }

  private lineOf(line: WrittenLine, campaign: Campaign): ViewElement {
    const item = new KeptHandle();
    this.items.set(line.source.line, item);
    const state = lineStateOf(campaign, line.source);
    const parts = [new Span({ cls: classesOf(glyphClassOf(line)), text: line.glyph, hiddenFromReaders: true }), this.textOf(line, state), ...this.stateOf(state)];
    const opener = lineOpenerOf({ campaign, source: line.source, openers: this.needs.openers });
    if (opener === null) return new ListItem({ cls: ["dd-written-line"], dataLine: line.source.line, bindings: [new HandleRequest(item)] }, parts);
    const open = new RunAction(this.open.bind(this, line.source, opener));
    const row = new SourceRow(line.source, open).build(parts, { cls: [], bindings: [new HandleRequest(this.rows.handleFor(line.source))] });
    return new ListItem({ cls: ["dd-written-line", "dd-written-line-open"], dataLine: line.source.line, bindings: [new HandleRequest(item)] }, [row]);
  }

  private textOf(line: WrittenLine, state: LineState | null): ViewElement {
    const cls = ["dd-line-text"];
    if (state !== null && state.struck) cls.push("dd-line-struck");
    return new Span({ cls }, new LinkedText([], line.source.path, this.needs.actions).build(line.text));
  }

  private stateOf(state: LineState | null): ViewElement[] {
    if (state === null) return [];
    return [new Span({ cls: ["dd-line-state"], text: state.sign, label: state.label, title: state.label })];
  }

  private open(source: Source, opener: OpenLine): void {
    opener(this.closed.bind(this, source));
  }

  private closed(source: Source, closed: LineClosed): void {
    let focusRow: FocusRow = this.rows.focus.bind(this.rows, source);
    if (closed.gone) focusRow = NO_ROW;
    this.rowFocus.afterClose(focusRow, closed.changed, this.list.focus.bind(this.list));
  }
}
