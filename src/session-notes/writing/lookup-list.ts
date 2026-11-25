import type { LookupMatch } from "../../lookups/lookup";
import { LOOKUP_CLASSES, lookupMatchParts } from "../../lookups/lookup-match-row";
import { HandleRequest, HoldFocusBinding, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Div, List, ListItem } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";

export class LookupList {
  private readonly element = new KeptHandle();
  private readonly heading = new KeptHandle();
  private readonly list = new KeptHandle();
  private matches: LookupMatch[] = [];
  private rows: KeptHandle[] = [];
  private selected = 0;
  private open = false;

  constructor(private readonly pick: (match: LookupMatch) => void) {}

  tree(): ViewElement {
    return new Div({ cls: ["dd-box-lookups"], hidden: true, bindings: [new HandleRequest(this.element)] }, [
      new Div({ cls: ["dd-box-lookups-heading"], bindings: [new HandleRequest(this.heading)] }),
      new List({ role: "listbox", bindings: [new HandleRequest(this.list)] }),
    ]);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(heading: string, matches: LookupMatch[], keywords: string[]): void {
    this.heading.setText(heading);
    this.matches = matches;
    this.rows = [];
    const rows: ViewElement[] = [];
    for (const match of matches) rows.push(this.rowOf(match, keywords));
    this.list.showInside(rows);
    this.list.setLabel(heading);
    this.select(0);
    this.element.setHidden(false);
    this.open = true;
  }

  close(): void {
    this.element.setHidden(true);
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

  private rowOf(match: LookupMatch, keywords: string[]): ViewElement {
    const kept = new KeptHandle();
    this.rows.push(kept);
    const bindings = [new HoldFocusBinding(), new PressBinding(new RunAction(this.picked.bind(this, match))), new HandleRequest(kept)];
    return new ListItem({ cls: ["dd-box-lookup", ...LOOKUP_CLASSES], role: "option", bindings }, lookupMatchParts(match, keywords));
  }

  private picked(match: LookupMatch): void {
    this.pick(match);
  }

  private select(index: number): void {
    this.selected = index;
    for (const [rowIndex, row] of this.rows.entries()) row.setSelected(rowIndex === index);
  }
}
