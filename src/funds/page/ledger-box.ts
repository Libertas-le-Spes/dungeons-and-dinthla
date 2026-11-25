import type { Source } from "../../campaign/record/campaign";
import type { CoinOutcome } from "../coins/coin-dialog";
import type { OpenLedgerEntry } from "../coins/open-ledger-entry";
import type { LinkOpener } from "../../views/components/rows/link-name";
import { scrollListParts } from "../../views/components/layout/scroll-list";
import { HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import type { ElementBinding } from "../../views/elements/bindings/element-binding";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, Div, Heading2, List, ListItem, Section, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import { NO_ROW, type FocusRow, type RowFocus } from "../../views/lists/row-focus";
import { ShownRows } from "../../views/pages/shown-rows";
import type { LedgerLine } from "./funds-summary";
import { LedgerRow } from "./rows/ledger-row";

export type AddCoinHere = (returnFocus: () => void) => void;

export interface LedgerBoxParts {
  opener: LinkOpener;
  openLedgerEntry: OpenLedgerEntry;
  addCoin: AddCoinHere | null;
  rowFocus: RowFocus;
  label: string;
}

export interface LedgerShown {
  lines: LedgerLine[];
  empty: string;
}

function entriesText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 entry";
  return `${count} entries`;
}

export class LedgerBox {
  private readonly count = new KeptHandle();
  private readonly list = new KeptHandle();
  private readonly addButton = new KeptHandle();
  private readonly rows = new ShownRows();

  constructor(private readonly parts: LedgerBoxParts) {}

  tree(): ViewElement {
    const head: ViewElement[] = [new Heading2({ cls: ["dd-title"], text: "Ledger" }, [new Span({ cls: ["dd-count"], bindings: [new HandleRequest(this.count)] })])];
    const addCoin = this.parts.addCoin;
    if (addCoin !== null) head.push(this.addCoinTree(addCoin));
    const list = new List(scrollListParts({ cls: ["dd-ledger"], bindings: [new HandleRequest(this.list)] }, this.parts.label));
    return new Section({ cls: ["dd-panel", "dd-ledger-panel"] }, [new Div({ cls: ["dd-head"] }, head), list]);
  }

  render({ lines, empty }: LedgerShown): void {
    this.count.setText(entriesText(lines.length));
    this.rows.clear();
    if (lines.length === 0) this.list.showInside([new ListItem({ cls: ["dd-empty"], text: empty })]);
    else this.list.showInside(lines.map(this.rowOf.bind(this)));
  }

  private addCoinTree(addCoin: AddCoinHere): ViewElement {
    const pressed = new RunAction(this.openAddCoin.bind(this, addCoin));
    return new Button({ cls: ["dd-create"], text: "Add coin", bindings: [new PressBinding(pressed), new HandleRequest(this.addButton)] });
  }

  private openAddCoin(addCoin: AddCoinHere): void {
    addCoin(this.addButton.focus.bind(this.addButton));
  }

  private rowOf(line: LedgerLine): ViewElement {
    const source = line.record.source;
    const bindings: ElementBinding[] = [new HandleRequest(this.rows.handleFor(source))];
    return new LedgerRow(this.parts.opener).build(line, new RunAction(this.openEntry.bind(this, source)), bindings);
  }

  private openEntry(source: Source): void {
    this.parts.openLedgerEntry(source, this.afterEntry.bind(this, source));
  }

  private afterEntry(source: Source, outcome: CoinOutcome): void {
    let focusRow: FocusRow = this.rows.focus.bind(this.rows, source);
    if (outcome === "deleted") focusRow = NO_ROW;
    this.parts.rowFocus.afterClose(focusRow, outcome !== "unchanged", this.focusWhenRowIsGone.bind(this));
  }

  private focusWhenRowIsGone(): void {
    if (this.parts.addCoin === null) this.list.focus();
    else this.addButton.focus();
  }
}
