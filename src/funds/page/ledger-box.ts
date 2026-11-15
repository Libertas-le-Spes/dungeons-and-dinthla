import { Component } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import type { CoinOutcome } from "../coins/coin-modal";
import type { OpenLedgerEntry } from "../coins/open-ledger-entry";
import type { LinkActions } from "../../views/lists/linked-text";
import { focusRowAt, NO_ROW, type RowFocus } from "../../views/lists/row-focus";
import { makeScrollList } from "../../views/lists/scroll-list";
import type { LedgerLine } from "./funds-summary";
import { addLedgerRow } from "./ledger-row";

export interface LedgerBoxParts {
  panel: HTMLElement;
  actions: LinkActions;
  openLedgerEntry: OpenLedgerEntry | null;
  addCoin: ((returnFocus: () => void) => void) | null;
  rowFocus: RowFocus;
}

function entriesText(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 entry";
  return `${count} entries`;
}

export interface LedgerShown {
  lines: LedgerLine[];
  empty: string;
}

export class LedgerBox extends Component {
  private readonly count: HTMLElement;
  private readonly list: HTMLElement;
  private readonly addButton: HTMLElement | null;

  constructor(private readonly parts: LedgerBoxParts) {
    super();
    const { panel, addCoin } = parts;
    const head = panel.createDiv({ cls: "dd-head" });
    const title = head.createEl("h2", { cls: "dd-title", text: "Ledger" });
    this.count = title.createSpan({ cls: "dd-count" });
    this.addButton = null;
    if (addCoin !== null) {
      const button = head.createEl("button", { cls: "dd-create", text: "Add coin" });
      this.registerDomEvent(button, "click", () => addCoin(() => button.focus()));
      this.addButton = button;
    }
    this.list = panel.createEl("ul", { cls: "dd-ledger" });
    makeScrollList({ element: this.list, label: "Ledger entries" });
  }

  render({ lines, empty }: LedgerShown): void {
    this.count.setText(entriesText(lines.length));
    this.list.empty();
    if (lines.length === 0) this.list.createEl("li", { cls: "dd-empty", text: empty });
    for (const line of lines) this.addRow(line);
  }

  private focusAddCoin(): void {
    if (this.addButton !== null) this.addButton.focus();
  }

  private afterEntry(source: Source, outcome: CoinOutcome): void {
    let focusRow = () => focusRowAt(this.list, source);
    if (outcome === "deleted") focusRow = NO_ROW;
    this.parts.rowFocus.afterClose(focusRow, outcome !== "unchanged", () => this.focusAddCoin());
  }

  private addRow(line: LedgerLine): void {
    let actions = this.parts.actions;
    const openLedgerEntry = this.parts.openLedgerEntry;
    if (openLedgerEntry !== null) {
      actions = { ...this.parts.actions, openRow: (source: Source) => openLedgerEntry(source, (outcome) => this.afterEntry(source, outcome)) };
    }
    addLedgerRow(this.list, line, actions, this.parts.actions);
  }
}
